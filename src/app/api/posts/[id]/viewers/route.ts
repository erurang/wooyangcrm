import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/posts/[id]/viewers
 * 게시글 조회자 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    if (!postId) {
      return NextResponse.json(
        { error: "게시글 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 총 조회자 수
    const { count, error: countError } = await supabase
      .from("post_views")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (countError) {
      console.error("Viewers count error:", countError);
    }

    // 조회자 목록 (유저 정보 포함)
    const { data: viewers, error } = await supabase
      .from("post_views")
      .select(`
        id,
        user_id,
        viewed_at,
        user:users!post_views_user_id_fkey(id, name, level)
      `)
      .eq("post_id", postId)
      .order("viewed_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Viewers fetch error:", error);
      return NextResponse.json(
        { error: "조회자 목록을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      viewers: viewers || [],
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Viewers API error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
