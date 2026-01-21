import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * POST /api/chat/rooms/[roomId]/read - 읽음 처리
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id가 필요합니다." },
        { status: 400 }
      );
    }

    // last_read_at 업데이트
    const { data: updatedParticipation, error: updateError } = await supabase
      .from("chat_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .eq("user_id", user_id)
      .is("left_at", null)
      .select()
      .single();

    if (updateError) {
      // 참여자가 아닐 경우
      return NextResponse.json(
        { error: "대화방에 참여하고 있지 않습니다." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      last_read_at: updatedParticipation.last_read_at,
    });
  } catch (error) {
    console.error("읽음 처리 실패:", error);
    return NextResponse.json(
      { error: "읽음 처리에 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/rooms/[roomId]/read - 읽음 상태 조회 (1:1 대화용)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    // 모든 참여자의 last_read_at 조회
    const { data: participants, error: partError } = await supabase
      .from("chat_participants")
      .select("user_id, last_read_at")
      .eq("room_id", roomId)
      .is("left_at", null);

    if (partError) throw partError;

    // 본인 제외 다른 참여자들의 읽음 상태
    const readStatus = participants
      ?.filter((p) => p.user_id !== userId)
      .map((p) => ({
        user_id: p.user_id,
        last_read_at: p.last_read_at,
      }));

    return NextResponse.json({
      read_status: readStatus || [],
    });
  } catch (error) {
    console.error("읽음 상태 조회 실패:", error);
    return NextResponse.json(
      { error: "읽음 상태를 불러오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}
