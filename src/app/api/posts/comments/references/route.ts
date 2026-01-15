import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/posts/comments/references
 * 댓글의 참조 목록 조회
 * Query params:
 *   - commentId: 댓글 ID (필수)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: references, error } = await supabase
      .from("comment_references")
      .select("*")
      .eq("comment_id", commentId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Comment references fetch error:", error);
      return NextResponse.json(
        { error: "참조 조회 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ references: references || [] });
  } catch (error) {
    console.error("Comment references GET error:", error);
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts/comments/references
 * 댓글에 참조 추가
 * Body:
 *   - commentId: 댓글 ID
 *   - reference_type: 'company' | 'consultation' | 'document'
 *   - reference_id: 참조 대상 ID
 *   - reference_name: 참조 대상 이름 (선택)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, reference_type, reference_id, reference_name } = body;

    if (!commentId || !reference_type || !reference_id) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("comment_references")
      .insert({
        comment_id: commentId,
        reference_type,
        reference_id,
        reference_name,
      })
      .select()
      .single();

    if (error) {
      // 중복 참조인 경우
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "이미 추가된 참조입니다." },
          { status: 409 }
        );
      }
      console.error("Comment reference insert error:", error);
      return NextResponse.json(
        { error: "참조 추가 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reference: data });
  } catch (error) {
    console.error("Comment references POST error:", error);
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/comments/references
 * 참조 삭제
 * Query params:
 *   - id: 참조 ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "참조 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("comment_references")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Comment reference delete error:", error);
      return NextResponse.json(
        { error: "참조 삭제 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comment references DELETE error:", error);
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 }
    );
  }
}
