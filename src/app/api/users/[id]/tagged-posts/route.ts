import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 유저가 태그된 게시글 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  // 유저가 태그된 post_user_tags 조회
  const { data: taggedPosts, error: tagsError, count } = await supabase
    .from("post_user_tags")
    .select(`
      id,
      tag_type,
      created_at,
      post_id,
      posts!inner (
        id,
        title,
        content,
        created_at,
        updated_at,
        view_count,
        is_pinned,
        deleted_at,
        user_id,
        category_id,
        users!posts_user_id_fkey (
          id,
          name,
          level
        ),
        post_categories (
          id,
          name
        )
      )
    `, { count: "exact" })
    .eq("user_id", id)
    .is("posts.deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (tagsError) {
    return NextResponse.json({ error: tagsError.message }, { status: 500 });
  }

  // 데이터 변환
  const posts = (taggedPosts || []).map((item: any) => ({
    id: item.posts.id,
    title: item.posts.title,
    content: item.posts.content,
    created_at: item.posts.created_at,
    updated_at: item.posts.updated_at,
    view_count: item.posts.view_count,
    is_pinned: item.posts.is_pinned,
    user_id: item.posts.user_id,
    category_id: item.posts.category_id,
    user: item.posts.users,
    category: item.posts.post_categories,
    tag_type: item.tag_type,
    tagged_at: item.created_at,
  }));

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    posts,
    total,
    page,
    limit,
    totalPages,
  });
}
