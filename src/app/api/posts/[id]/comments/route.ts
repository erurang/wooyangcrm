import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  const { data: comments, error } = await supabase
    .from("post_comments")
    .select(
      `
      *,
      user:users!post_comments_user_id_fkey(id, name, level)
    `
    )
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(comments || []);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { user_id, content, parent_id } = body;

    if (!user_id || !content) {
      return NextResponse.json(
        { error: "필수 필드(user_id, content)가 누락되었습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("post_comments")
      .insert([
        {
          post_id: id,
          user_id,
          content,
          parent_id: parent_id || null,
        },
      ])
      .select(
        `
        *,
        user:users!post_comments_user_id_fkey(id, name, level)
      `
      )
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
