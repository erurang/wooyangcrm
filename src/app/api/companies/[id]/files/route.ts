import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface FileItem {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  source_type: "consultation" | "post" | "comment";
  source_id: string;
  source_title?: string;
  signed_url?: string;
  user?: { id: string; name: string };
}

/**
 * GET /api/companies/[id]/files
 * 해당 회사와 연관된 모든 파일 조회
 * - consultation_files: 회사의 상담에 첨부된 파일
 * - post_files: 회사를 참조한 게시글의 첨부파일
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const type = searchParams.get("type") || "all"; // all, consultation, post

    const allFiles: FileItem[] = [];

    // 1. 회사의 상담에서 첨부된 파일 조회
    if (type === "all" || type === "consultation") {
      // 회사의 상담 ID 조회
      const { data: consultations } = await supabase
        .from("consultations")
        .select("id, date")
        .eq("company_id", companyId);

      if (consultations && consultations.length > 0) {
        const consultationIds = consultations.map((c) => c.id);
        const consultationMap = new Map(
          consultations.map((c) => [c.id, c.date])
        );

        const { data: consultationFiles } = await supabase
          .from("consultation_files")
          .select("id, file_name, file_url, created_at, consultation_id, user_id")
          .in("consultation_id", consultationIds);

        if (consultationFiles) {
          for (const file of consultationFiles) {
            // Signed URL 생성
            const filePath = file.file_url.startsWith("consultations/")
              ? file.file_url
              : `consultations/${file.file_url}`;

            const { data: signedUrlData } = await supabase.storage
              .from("consultation_files")
              .createSignedUrl(filePath, 60 * 5);

            allFiles.push({
              id: file.id,
              file_name: file.file_name,
              file_url: file.file_url,
              created_at: file.created_at,
              source_type: "consultation",
              source_id: file.consultation_id,
              source_title: `상담 (${consultationMap.get(file.consultation_id) || ""})`,
              signed_url: signedUrlData?.signedUrl,
            });
          }
        }
      }
    }

    // 2. 회사를 참조한 게시글의 파일 조회
    if (type === "all" || type === "post") {
      // 회사를 참조한 게시글 ID 조회
      const { data: references } = await supabase
        .from("post_references")
        .select("post_id")
        .eq("reference_type", "company")
        .eq("reference_id", companyId);

      if (references && references.length > 0) {
        const postIds = references.map((r) => r.post_id);

        // 게시글 제목 조회
        const { data: posts } = await supabase
          .from("posts")
          .select("id, title")
          .in("id", postIds)
          .is("deleted_at", null);

        if (posts && posts.length > 0) {
          const postMap = new Map(posts.map((p) => [p.id, p.title]));
          const validPostIds = posts.map((p) => p.id);

          const { data: postFiles } = await supabase
            .from("post_files")
            .select("id, file_name, file_url, created_at, post_id, user_id")
            .in("post_id", validPostIds);

          if (postFiles) {
            for (const file of postFiles) {
              // Signed URL 생성
              const filePath = file.file_url.startsWith("posts/")
                ? file.file_url
                : `posts/${file.file_url}`;

              const { data: signedUrlData } = await supabase.storage
                .from("post_files")
                .createSignedUrl(filePath, 60 * 5);

              allFiles.push({
                id: file.id,
                file_name: file.file_name,
                file_url: file.file_url,
                created_at: file.created_at,
                source_type: "post",
                source_id: file.post_id,
                source_title: postMap.get(file.post_id),
                signed_url: signedUrlData?.signedUrl,
              });
            }
          }
        }
      }
    }

    // 정렬: 최신순
    allFiles.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 페이지네이션
    const total = allFiles.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedFiles = allFiles.slice(offset, offset + limit);

    return NextResponse.json({
      files: paginatedFiles,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Company files GET error:", error);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
