import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * PUT /api/posts/comments/[commentId]
 * 댓글 수정
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const body = await request.json();
    const { content, user_id } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: "댓글 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "댓글 내용이 필요합니다." },
        { status: 400 }
      );
    }

    // 댓글 작성자 확인
    const { data: comment } = await supabase
      .from("post_comments")
      .select("user_id, deleted_at")
      .eq("id", commentId)
      .single();

    if (!comment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (comment.deleted_at) {
      return NextResponse.json(
        { error: "삭제된 댓글은 수정할 수 없습니다." },
        { status: 400 }
      );
    }

    if (comment.user_id !== user_id) {
      return NextResponse.json(
        { error: "본인의 댓글만 수정할 수 있습니다." },
        { status: 403 }
      );
    }

    // 댓글 수정
    const { data, error } = await supabase
      .from("post_comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select(`
        *,
        user:users!post_comments_user_id_fkey(id, name, level)
      `)
      .single();

    if (error) {
      console.error("Comment update error:", error);
      return NextResponse.json(
        { error: "댓글 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Comment PUT error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/comments/[commentId]
 * 댓글 삭제 (블라인드 처리 - deleted_at 설정)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!commentId) {
      return NextResponse.json(
        { error: "댓글 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 댓글 작성자 확인
    const { data: comment } = await supabase
      .from("post_comments")
      .select("user_id, deleted_at")
      .eq("id", commentId)
      .single();

    if (!comment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (comment.deleted_at) {
      return NextResponse.json(
        { error: "이미 삭제된 댓글입니다." },
        { status: 400 }
      );
    }

    if (comment.user_id !== userId) {
      return NextResponse.json(
        { error: "본인의 댓글만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 블라인드 처리 (deleted_at 설정)
    const { error } = await supabase
      .from("post_comments")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", commentId);

    if (error) {
      console.error("Comment delete error:", error);
      return NextResponse.json(
        { error: "댓글 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    // 첨부파일도 블라인드 처리 (실제 삭제하지 않음, 조회 시 필터링)
    // 파일은 DB에 남겨두고 프론트에서 deleted_at이 있으면 표시하지 않음

    return NextResponse.json({ success: true, deleted_at: new Date().toISOString() });
  } catch (error) {
    console.error("Comment DELETE error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
