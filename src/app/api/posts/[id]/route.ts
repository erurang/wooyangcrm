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

  // 조회수 증가
  await supabase.rpc("increment_post_view_count", { post_id: id });

  // 게시글 조회
  const { data: post, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      user:users!posts_user_id_fkey(id, name, level),
      category:post_categories!posts_category_id_fkey(id, name),
      consultation:consultations(id, company_id, date, content),
      document:documents(id, document_number, type, status)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // 첨부파일 조회
  const { data: files } = await supabase
    .from("post_files")
    .select("*")
    .eq("post_id", id);

  return NextResponse.json({
    ...post,
    files: files || [],
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { category_id, consultation_id, document_id, title, content, is_pinned } =
      body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (category_id !== undefined) updateData.category_id = category_id;
    if (consultation_id !== undefined)
      updateData.consultation_id = consultation_id;
    if (document_id !== undefined) updateData.document_id = document_id;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;

    const { data, error } = await supabase
      .from("posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating post:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
