import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/users/[id]/board-stats
 * 유저의 게시판 활동 통계
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "유저 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 유저 정보 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, level, position, created_at")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "유저를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 게시글 수 조회
    const { count: postsCount, error: postsError } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (postsError) {
      console.error("Posts count error:", postsError);
    }

    // 댓글 수 조회 (삭제되지 않은 것만)
    const { count: commentsCount, error: commentsError } = await supabase
      .from("post_comments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (commentsError) {
      console.error("Comments count error:", commentsError);
    }

    // 총 조회수 조회
    const { data: viewData, error: viewError } = await supabase
      .from("posts")
      .select("view_count")
      .eq("user_id", userId);

    if (viewError) {
      console.error("View count error:", viewError);
    }

    const totalViews = viewData?.reduce((sum, post) => sum + (post.view_count || 0), 0) || 0;

    // 최근 활동일 (게시글 또는 댓글 중 최근)
    const { data: latestPost } = await supabase
      .from("posts")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: latestComment } = await supabase
      .from("post_comments")
      .select("created_at")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let lastActivityAt = null;
    if (latestPost?.created_at && latestComment?.created_at) {
      lastActivityAt = new Date(latestPost.created_at) > new Date(latestComment.created_at)
        ? latestPost.created_at
        : latestComment.created_at;
    } else {
      lastActivityAt = latestPost?.created_at || latestComment?.created_at || null;
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        level: user.level,
        position: user.position,
        joined_at: user.created_at,
      },
      stats: {
        posts_count: postsCount || 0,
        comments_count: commentsCount || 0,
        total_views: totalViews,
        last_activity_at: lastActivityAt,
      },
    });
  } catch (error) {
    console.error("User board stats error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
