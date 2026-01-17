import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/users/[id]/comments
 * 유저가 작성한 댓글 목록 (게시글 정보 포함)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        { error: "유저 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 총 개수 조회 (삭제되지 않은 것만)
    const { count, error: countError } = await supabase
      .from("post_comments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (countError) {
      console.error("Comments count error:", countError);
    }

    // 댓글 목록 조회 (게시글 정보 포함)
    const { data: comments, error } = await supabase
      .from("post_comments")
      .select(`
        id,
        content,
        created_at,
        updated_at,
        post_id,
        post:posts!post_comments_post_id_fkey(id, title)
      `)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Comments fetch error:", error);
      return NextResponse.json(
        { error: "댓글 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      comments: comments || [],
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("User comments error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
