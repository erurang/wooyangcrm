import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { CreateChatRoomRequest, ChatRoomWithRelations } from "@/types/chat";

/**
 * GET /api/chat/rooms - 내 대화방 목록 조회
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const search = searchParams.get("search") || "";

    if (!userId) {
      return NextResponse.json(
        { error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    // 내가 참여중인 대화방 ID 조회
    const { data: participations, error: partError } = await supabase
      .from("chat_participants")
      .select("room_id, last_read_at")
      .eq("user_id", userId)
      .is("left_at", null);

    if (partError) throw partError;

    if (!participations || participations.length === 0) {
      return NextResponse.json({ rooms: [], total: 0 });
    }

    const roomIds = participations.map((p) => p.room_id);
    const lastReadMap = new Map(
      participations.map((p) => [p.room_id, p.last_read_at])
    );

    // 대화방 목록 조회
    let query = supabase
      .from("chat_rooms")
      .select(
        `
        *,
        participants:chat_participants(
          id, user_id, last_read_at, role,
          user:users(id, name, position, level)
        )
      `
      )
      .in("id", roomIds)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    // 검색어 필터
    if (search) {
      query = query.or(`name.ilike.%${search}%,last_message_preview.ilike.%${search}%`);
    }

    const { data: rooms, error: roomsError } = await query;

    if (roomsError) throw roomsError;

    // 안읽은 메시지 수 계산
    const roomsWithUnread: ChatRoomWithRelations[] = await Promise.all(
      (rooms || []).map(async (room) => {
        const lastReadAt = lastReadMap.get(room.id);

        let unreadCount = 0;
        if (lastReadAt) {
          const { count } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("room_id", room.id)
            .neq("sender_id", userId)
            .gt("created_at", lastReadAt);
          unreadCount = count || 0;
        } else {
          // 한번도 읽지 않은 경우 전체 메시지 수
          const { count } = await supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("room_id", room.id)
            .neq("sender_id", userId);
          unreadCount = count || 0;
        }

        // 1:1 대화의 경우 상대방 정보 추출
        let otherUser = undefined;
        if (room.type === "direct" && room.participants) {
          const otherParticipant = room.participants.find(
            (p: { user_id: string }) => p.user_id !== userId
          );
          otherUser = otherParticipant?.user;
        }

        return {
          ...room,
          unread_count: unreadCount,
          other_user: otherUser,
        };
      })
    );

    return NextResponse.json({
      rooms: roomsWithUnread,
      total: roomsWithUnread.length,
    });
  } catch (error) {
    console.error("대화방 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "대화방 목록을 불러오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/rooms - 대화방 생성
 */
export async function POST(req: NextRequest) {
  try {
    const body: CreateChatRoomRequest & { created_by: string } = await req.json();
    const { type, name, participant_ids, created_by } = body;

    if (!created_by || !participant_ids || participant_ids.length === 0) {
      return NextResponse.json(
        { error: "created_by와 participant_ids가 필요합니다." },
        { status: 400 }
      );
    }

    // 1:1 대화인 경우 기존 대화방 확인
    if (type === "direct" && participant_ids.length === 1) {
      const otherUserId = participant_ids[0];

      // 두 사용자가 모두 참여하는 direct 대화방 찾기
      const { data: existingRoom } = await supabase
        .from("chat_rooms")
        .select(
          `
          id,
          participants:chat_participants(user_id)
        `
        )
        .eq("type", "direct")
        .then(async (result) => {
          if (!result.data) return { data: null };

          // 두 사용자가 모두 참여하는 방 찾기
          for (const room of result.data) {
            const participantIds = room.participants.map(
              (p: { user_id: string }) => p.user_id
            );
            if (
              participantIds.includes(created_by) &&
              participantIds.includes(otherUserId) &&
              participantIds.length === 2
            ) {
              return { data: room };
            }
          }
          return { data: null };
        });

      if (existingRoom) {
        return NextResponse.json(existingRoom);
      }
    }

    // 대화방 생성
    const { data: newRoom, error: roomError } = await supabase
      .from("chat_rooms")
      .insert({
        type,
        name: type === "group" ? name : null,
        created_by,
      })
      .select()
      .single();

    if (roomError) throw roomError;

    // 생성자를 admin으로 참여자 추가
    const allParticipants = [
      { room_id: newRoom.id, user_id: created_by, role: "admin" },
      ...participant_ids.map((id) => ({
        room_id: newRoom.id,
        user_id: id,
        role: "member",
      })),
    ];

    const { error: participantsError } = await supabase
      .from("chat_participants")
      .insert(allParticipants);

    if (participantsError) throw participantsError;

    // 시스템 메시지 추가
    const { error: messageError } = await supabase.from("chat_messages").insert({
      room_id: newRoom.id,
      sender_id: null,
      content:
        type === "group"
          ? "대화방이 생성되었습니다."
          : "대화를 시작합니다.",
      message_type: "system",
    });

    if (messageError) {
      console.error("시스템 메시지 생성 실패:", messageError);
    }

    // 생성된 대화방 + 참여자 정보 반환
    const { data: createdRoom, error: fetchError } = await supabase
      .from("chat_rooms")
      .select(
        `
        *,
        participants:chat_participants(
          id, user_id, last_read_at, role,
          user:users(id, name, position, level)
        )
      `
      )
      .eq("id", newRoom.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json(createdRoom, { status: 201 });
  } catch (error) {
    console.error("대화방 생성 실패:", error);
    return NextResponse.json(
      { error: "대화방을 생성하는 데 실패했습니다." },
      { status: 500 }
    );
  }
}
