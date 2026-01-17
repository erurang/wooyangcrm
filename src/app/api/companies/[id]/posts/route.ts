import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/companies/[id]/posts
 * 해당 회사를 참조(태그)한 게시글 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    // 1. 해당 회사를 참조한 post_references 조회
    const { data: references, error: refError } = await supabase
      .from("post_references")
      .select("post_id")
      .eq("reference_type", "company")
      .eq("reference_id", companyId);

    if (refError) {
      console.error("References fetch error:", refError);
      return NextResponse.json(
        { error: "참조 조회 실패" },
        { status: 500 }
      );
    }

    if (!references || references.length === 0) {
      return NextResponse.json({
        posts: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
    }

    const postIds = references.map((r) => r.post_id);

    // 2. 게시글 조회 (삭제되지 않은 것만)
    const { data: posts, error: postError, count } = await supabase
      .from("posts")
      .select(
        `
        *,
        user:users!posts_user_id_fkey(id, name, level),
        category:post_categories(id, name)
      `,
        { count: "exact" }
      )
      .in("id", postIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (postError) {
      console.error("Posts fetch error:", postError);
      return NextResponse.json(
        { error: "게시글 조회 실패" },
        { status: 500 }
      );
    }

    // 3. 댓글 수 조회
    const postsWithCount = await Promise.all(
      (posts || []).map(async (post) => {
        const { count: commentsCount } = await supabase
          .from("post_comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id)
          .is("deleted_at", null);

        return {
          ...post,
          comments_count: commentsCount || 0,
        };
      })
    );

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      posts: postsWithCount,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Company posts GET error:", error);
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 }
    );
  }
}
