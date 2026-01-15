import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/posts/references
 * 게시글의 참조 목록 조회
 * Query params:
 *   - postId: 게시글 ID (필수)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "postId가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: references, error } = await supabase
      .from("post_references")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("References fetch error:", error);
      return NextResponse.json(
        { error: "참조 조회 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ references: references || [] });
  } catch (error) {
    console.error("References GET error:", error);
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts/references
 * 게시글에 참조 추가
 * Body:
 *   - postId: 게시글 ID
 *   - reference_type: 'company' | 'consultation' | 'document'
 *   - reference_id: 참조 대상 ID
 *   - reference_name: 참조 대상 이름 (선택)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, reference_type, reference_id, reference_name } = body;

    if (!postId || !reference_type || !reference_id) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("post_references")
      .insert({
        post_id: postId,
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
      console.error("Reference insert error:", error);
      return NextResponse.json(
        { error: "참조 추가 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reference: data });
  } catch (error) {
    console.error("References POST error:", error);
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/references
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
      .from("post_references")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Reference delete error:", error);
      return NextResponse.json(
        { error: "참조 삭제 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("References DELETE error:", error);
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 }
    );
  }
}
