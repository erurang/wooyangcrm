import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/chat/rooms/[roomId]/search - 대화방 내 메시지 검색
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const query = searchParams.get("query") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!userId) {
      return NextResponse.json(
        { error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "검색어는 2글자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // 참여자인지 확인
    const { data: participation, error: partError } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .is("left_at", null)
      .single();

    if (partError || !participation) {
      return NextResponse.json(
        { error: "대화방에 접근할 수 없습니다." },
        { status: 403 }
      );
    }

    // 메시지 검색
    const { data: messages, error: searchError, count } = await supabase
      .from("chat_messages")
      .select(
        `
        id, content, message_type, created_at,
        sender:users!chat_messages_sender_id_fkey(id, name)
      `,
        { count: "exact" }
      )
      .eq("room_id", roomId)
      .eq("is_deleted", false)
      .neq("message_type", "system")
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (searchError) throw searchError;

    return NextResponse.json({
      messages: messages || [],
      total: count || 0,
      has_more: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error("메시지 검색 실패:", error);
    return NextResponse.json(
      { error: "메시지 검색에 실패했습니다." },
      { status: 500 }
    );
  }
}
