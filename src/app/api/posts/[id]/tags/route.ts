import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// 알림 생성 함수
async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId: string,
  relatedType: string
) {
  try {
    const { error } = await supabase
      .from("notifications")
      .insert([{
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId,
        related_type: relatedType,
        read: false,
      }]);

    if (error) {
      console.error("알림 생성 실패:", error);
    }
  } catch (e) {
    console.error("알림 생성 예외:", e);
  }
}

// GET: 게시글의 유저 태그 목록
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;

  if (!postId) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("post_user_tags")
    .select(`
      id,
      created_at,
      post_id,
      user_id,
      tag_type,
      user:users!post_user_tags_user_id_fkey(id, name, level)
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching post user tags:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tags: data || [] });
}

// POST: 유저 태그 추가
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;

  if (!postId) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { user_id, tag_type } = body;

    if (!user_id || !tag_type) {
      return NextResponse.json(
        { error: "user_id and tag_type are required" },
        { status: 400 }
      );
    }

    // 중복 체크
    const { data: existing } = await supabase
      .from("post_user_tags")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", user_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "User already tagged" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("post_user_tags")
      .insert({
        post_id: postId,
        user_id,
        tag_type,
      })
      .select(`
        id,
        created_at,
        post_id,
        user_id,
        tag_type,
        user:users!post_user_tags_user_id_fkey(id, name, level)
      `)
      .single();

    if (error) {
      console.error("Error creating post user tag:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 태그된 유저에게 알림 전송
    const { data: post } = await supabase
      .from("posts")
      .select("title, user_id")
      .eq("id", postId)
      .single();

    if (post && user_id !== post.user_id) {
      // 게시글 작성자 이름 조회
      const { data: author } = await supabase
        .from("users")
        .select("name")
        .eq("id", post.user_id)
        .single();

      await createNotification(
        user_id,
        "post_mention", // 기존 타입 재사용
        "게시글 태그",
        `${author?.name || "누군가"}님이 "${post.title}" 게시글에 회원님을 태그했습니다.`,
        postId,
        "post"
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// DELETE: 유저 태그 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!postId) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("post_user_tags")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting post user tag:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
