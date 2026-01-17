import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { logPostOperation } from "@/lib/postLogger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  // 조회 기록 및 조회수 증가
  if (userId) {
    // 이미 조회한 기록이 있는지 확인
    const { data: existingView } = await supabase
      .from("post_views")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", userId)
      .maybeSingle();

    // 처음 조회하는 경우에만 기록 추가 및 조회수 증가
    if (!existingView) {
      // 조회 기록 추가 (테이블이 없어도 무시)
      try {
        await supabase.from("post_views").insert({
          post_id: id,
          user_id: userId,
        });
      } catch {
        // post_views 테이블이 없으면 무시
      }

      // 조회수 증가 (현재 값 + 1)
      const { data: currentPost } = await supabase
        .from("posts")
        .select("view_count")
        .eq("id", id)
        .single();

      if (currentPost) {
        await supabase
          .from("posts")
          .update({ view_count: (currentPost.view_count || 0) + 1 })
          .eq("id", id);
      }
    }
  }

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

  // 삭제된 게시글 체크
  if (post.deleted_at) {
    return NextResponse.json({ error: "삭제된 게시글입니다." }, { status: 404 });
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
    const { category_id, consultation_id, document_id, title, content, is_pinned, user_id } =
      body;

    // 기존 게시글 데이터 조회 (버전 저장 및 로깅용)
    const { data: oldPost } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    // 제목/내용 변경 시 버전 저장
    if (oldPost && (
      (title !== undefined && oldPost.title !== title) ||
      (content !== undefined && oldPost.content !== content)
    )) {
      // 현재 최대 버전 번호 조회
      const { data: maxVersion } = await supabase
        .from("post_versions")
        .select("version_number")
        .eq("post_id", id)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = (maxVersion?.version_number || 0) + 1;

      // 이전 버전 저장
      try {
        await supabase.from("post_versions").insert({
          post_id: id,
          version_number: nextVersion,
          title: oldPost.title,
          content: oldPost.content,
          category_id: oldPost.category_id,
          edited_by: user_id || oldPost.user_id,
        });
      } catch (versionError) {
        console.error("Failed to save version:", versionError);
        // 버전 저장 실패해도 업데이트는 계속 진행
      }
    }

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

    // 로깅
    await logPostOperation(
      "UPDATE",
      id,
      oldPost as Record<string, unknown>,
      data as Record<string, unknown>,
      user_id || oldPost?.user_id || ""
    );

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
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!id) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
  }

  // 기존 게시글 데이터 조회 (로깅용)
  const { data: oldPost } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  // 소프트 삭제 (deleted_at 설정)
  const deletedAt = new Date().toISOString();
  const { error } = await supabase
    .from("posts")
    .update({ deleted_at: deletedAt })
    .eq("id", id);

  if (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 로깅
  await logPostOperation(
    "DELETE",
    id,
    oldPost as Record<string, unknown>,
    null,
    userId || oldPost?.user_id || ""
  );

  return NextResponse.json({ success: true, deleted_at: deletedAt });
}
