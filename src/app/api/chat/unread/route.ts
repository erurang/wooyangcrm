import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/chat/unread - 전체 안읽은 메시지 수 조회
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    // 내가 참여중인 대화방들의 last_read_at 조회
    const { data: participations, error: partError } = await supabase
      .from("chat_participants")
      .select("room_id, last_read_at")
      .eq("user_id", userId)
      .is("left_at", null);

    if (partError) throw partError;

    if (!participations || participations.length === 0) {
      return NextResponse.json({
        total: 0,
        by_room: [],
      });
    }

    // 각 대화방별 안읽은 메시지 수 계산
    const unreadCounts = await Promise.all(
      participations.map(async (p) => {
        let count = 0;

        if (p.last_read_at) {
          const { count: unreadCount } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("room_id", p.room_id)
            .neq("sender_id", userId)
            .gt("created_at", p.last_read_at);
          count = unreadCount || 0;
        } else {
          // 한번도 읽지 않은 경우 내가 보낸 것 제외 전체
          const { count: unreadCount } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("room_id", p.room_id)
            .neq("sender_id", userId);
          count = unreadCount || 0;
        }

        return {
          room_id: p.room_id,
          count,
        };
      })
    );

    const total = unreadCounts.reduce((sum, item) => sum + item.count, 0);
    const byRoom = unreadCounts.filter((item) => item.count > 0);

    return NextResponse.json({
      total,
      by_room: byRoom,
    });
  } catch (error) {
    console.error("안읽은 메시지 수 조회 실패:", error);
    return NextResponse.json(
      { error: "안읽은 메시지 수를 조회하는 데 실패했습니다." },
      { status: 500 }
    );
  }
}
