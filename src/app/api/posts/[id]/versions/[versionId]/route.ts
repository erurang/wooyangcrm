import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/posts/[id]/versions/[versionId]
 * 특정 버전 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { id: postId, versionId } = await params;

    if (!postId || !versionId) {
      return NextResponse.json(
        { error: "게시글 ID와 버전 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 버전 상세 조회 (내용 포함)
    const { data: version, error } = await supabase
      .from("post_versions")
      .select(`
        id,
        post_id,
        version_number,
        title,
        content,
        category_id,
        edited_by,
        edited_at,
        user:users!post_versions_edited_by_fkey(id, name, level)
      `)
      .eq("id", versionId)
      .eq("post_id", postId)
      .single();

    if (error) {
      console.error("Version fetch error:", error);
      return NextResponse.json(
        { error: "버전을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    if (!version) {
      return NextResponse.json(
        { error: "버전을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(version);
  } catch (error) {
    console.error("Version detail API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
