import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/posts/[id]/versions
 * 게시글 버전 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: "게시글 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 버전 목록 조회 (수정자 정보 포함)
    const { data: versions, error } = await supabase
      .from("post_versions")
      .select(`
        id,
        post_id,
        version_number,
        title,
        edited_by,
        edited_at,
        user:users!post_versions_edited_by_fkey(id, name, level)
      `)
      .eq("post_id", postId)
      .order("version_number", { ascending: false });

    if (error) {
      console.error("Versions fetch error:", error);
      return NextResponse.json(
        { error: "버전 목록을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      versions: versions || [],
    });
  } catch (error) {
    console.error("Versions API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
