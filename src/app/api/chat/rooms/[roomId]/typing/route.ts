import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/chat/rooms/[roomId]/typing - 타이핑 중인 사용자 목록
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

    // 3초 이내 타이핑 상태만 조회 (자신 제외)
    const threeSecondsAgo = new Date(Date.now() - 3000).toISOString();

    const { data: typingUsers, error } = await supabase
      .from("chat_typing")
      .select(
        `
        user_id, updated_at,
        user:users(id, name)
      `
      )
      .eq("room_id", roomId)
      .neq("user_id", userId)
      .gte("updated_at", threeSecondsAgo);

    if (error) throw error;

    return NextResponse.json({
      typing_users: typingUsers || [],
    });
  } catch (error) {
    console.error("타이핑 상태 조회 실패:", error);
    return NextResponse.json(
      { error: "타이핑 상태를 불러오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/rooms/[roomId]/typing - 타이핑 상태 업데이트
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { user_id, is_typing } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id가 필요합니다." },
        { status: 400 }
      );
    }

    // 참여자인지 확인
    const { data: participation, error: partError } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", user_id)
      .is("left_at", null)
      .single();

    if (partError || !participation) {
      return NextResponse.json(
        { error: "대화방에 참여하고 있지 않습니다." },
        { status: 403 }
      );
    }

    if (is_typing) {
      // 타이핑 시작 - upsert
      const { error: upsertError } = await supabase
        .from("chat_typing")
        .upsert(
          {
            room_id: roomId,
            user_id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "room_id,user_id" }
        );

      if (upsertError) throw upsertError;
    } else {
      // 타이핑 종료 - 삭제
      const { error: deleteError } = await supabase
        .from("chat_typing")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", user_id);

      if (deleteError) throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("타이핑 상태 업데이트 실패:", error);
    return NextResponse.json(
      { error: "타이핑 상태를 업데이트하는 데 실패했습니다." },
      { status: 500 }
    );
  }
}
