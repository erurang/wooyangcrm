import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 유저가 멘션된 댓글 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  // 먼저 유저 정보를 가져와서 이름 확인
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("name")
    .eq("id", id)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userName = userData.name;

  // 댓글 내용에 @userName이 포함된 댓글 검색
  // ILIKE를 사용하여 대소문자 구분 없이 검색
  const { data: comments, error: commentsError, count } = await supabase
    .from("post_comments")
    .select(`
      id,
      content,
      created_at,
      updated_at,
      deleted_at,
      post_id,
      user_id,
      parent_id,
      users!post_comments_user_id_fkey (
        id,
        name,
        level
      ),
      posts!inner (
        id,
        title,
        deleted_at
      )
    `, { count: "exact" })
    .ilike("content", `%@${userName}%`)
    .is("deleted_at", null)
    .is("posts.deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (commentsError) {
    return NextResponse.json({ error: commentsError.message }, { status: 500 });
  }

  // 데이터 변환
  const mentionedComments = (comments || []).map((comment: any) => ({
    id: comment.id,
    content: comment.content,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    post_id: comment.post_id,
    user_id: comment.user_id,
    parent_id: comment.parent_id,
    user: comment.users,
    post: {
      id: comment.posts.id,
      title: comment.posts.title,
    },
  }));

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    comments: mentionedComments,
    total,
    page,
    limit,
    totalPages,
  });
}
