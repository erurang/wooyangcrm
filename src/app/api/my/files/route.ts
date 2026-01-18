import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export interface MyFile {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  source_type: "consultation" | "post" | "comment";
  source_id: string;
  source_title?: string;
}

// GET: 유저가 업로드한 모든 파일 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const type = searchParams.get("type") || "all"; // all, consultation, post, comment
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const files: MyFile[] = [];
  let totalCount = 0;

  // 상담 파일 조회
  if (type === "all" || type === "consultation") {
    const consultationQuery = supabase
      .from("consultation_files")
      .select(
        `
        id,
        file_url,
        created_at,
        consultation_id,
        consultations!inner (
          id,
          companies (
            name
          )
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId);

    if (search) {
      consultationQuery.ilike("file_url", `%${search}%`);
    }

    const { data: consultationFiles, count: consultationCount } =
      await consultationQuery;

    if (consultationFiles) {
      for (const file of consultationFiles) {
        const consultation = file.consultations as any;
        files.push({
          id: file.id,
          file_name: extractFileName(file.file_url),
          file_url: file.file_url,
          created_at: file.created_at,
          source_type: "consultation",
          source_id: file.consultation_id,
          source_title: consultation?.companies?.name || "상담",
        });
      }
    }
    if (type === "consultation") {
      totalCount = consultationCount || 0;
    } else {
      totalCount += consultationCount || 0;
    }
  }

  // 게시글 파일 조회
  if (type === "all" || type === "post") {
    const postQuery = supabase
      .from("post_files")
      .select(
        `
        id,
        file_name,
        file_url,
        created_at,
        post_id,
        posts!inner (
          id,
          title,
          deleted_at
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .is("posts.deleted_at", null);

    if (search) {
      postQuery.ilike("file_name", `%${search}%`);
    }

    const { data: postFiles, count: postCount } = await postQuery;

    if (postFiles) {
      for (const file of postFiles) {
        const post = file.posts as any;
        files.push({
          id: file.id,
          file_name: file.file_name,
          file_url: file.file_url,
          created_at: file.created_at,
          source_type: "post",
          source_id: file.post_id,
          source_title: post?.title || "게시글",
        });
      }
    }
    if (type === "post") {
      totalCount = postCount || 0;
    } else {
      totalCount += postCount || 0;
    }
  }

  // 댓글 파일 조회
  if (type === "all" || type === "comment") {
    const commentQuery = supabase
      .from("post_comment_files")
      .select(
        `
        id,
        name,
        url,
        created_at,
        comment_id,
        post_comments!inner (
          id,
          post_id,
          deleted_at,
          posts!inner (
            id,
            title,
            deleted_at
          )
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .is("post_comments.deleted_at", null)
      .is("post_comments.posts.deleted_at", null);

    if (search) {
      commentQuery.ilike("name", `%${search}%`);
    }

    const { data: commentFiles, count: commentCount } = await commentQuery;

    if (commentFiles) {
      for (const file of commentFiles) {
        const comment = file.post_comments as any;
        files.push({
          id: file.id,
          file_name: file.name,
          file_url: file.url,
          created_at: file.created_at,
          source_type: "comment",
          source_id: comment?.post_id || "",
          source_title: comment?.posts?.title || "댓글",
        });
      }
    }
    if (type === "comment") {
      totalCount = commentCount || 0;
    } else {
      totalCount += commentCount || 0;
    }
  }

  // 날짜순 정렬
  files.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // 페이지네이션 적용
  const paginatedFiles = files.slice(offset, offset + limit);

  const totalPages = Math.ceil(totalCount / limit);

  return NextResponse.json({
    files: paginatedFiles,
    total: totalCount,
    page,
    limit,
    totalPages,
  });
}

// 파일 URL에서 파일명 추출
function extractFileName(fileUrl: string): string {
  try {
    const url = new URL(fileUrl);
    const pathname = url.pathname;
    const fileName = pathname.split("/").pop() || "file";
    // URL 인코딩된 파일명 디코딩
    return decodeURIComponent(fileName);
  } catch {
    return fileUrl.split("/").pop() || "file";
  }
}
