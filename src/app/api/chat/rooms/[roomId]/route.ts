import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/chat/rooms/[roomId] - 대화방 상세 정보 조회
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

    // 참여자인지 확인
    const { data: participation, error: partError } = await supabase
      .from("chat_participants")
      .select("id, last_read_at, role")
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

    // 대화방 정보 + 참여자 조회
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select(
        `
        *,
        participants:chat_participants(
          id, user_id, last_read_at, role, joined_at, is_muted,
          user:users(id, name, position, level)
        )
      `
      )
      .eq("id", roomId)
      .single();

    if (roomError) throw roomError;

    // 활성 참여자만 필터링
    const activeParticipants = room.participants?.filter(
      (p: { left_at: string | null }) => !p.left_at
    );

    return NextResponse.json({
      ...room,
      participants: activeParticipants,
      my_role: participation.role,
      my_last_read_at: participation.last_read_at,
    });
  } catch (error) {
    console.error("대화방 정보 조회 실패:", error);
    return NextResponse.json(
      { error: "대화방 정보를 불러오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chat/rooms/[roomId] - 대화방 정보 수정 (그룹방만)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { userId, name, image_url } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    // admin 권한 확인
    const { data: participation, error: partError } = await supabase
      .from("chat_participants")
      .select("role")
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

    if (participation.role !== "admin") {
      return NextResponse.json(
        { error: "대화방 수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 대화방이 그룹인지 확인
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select("type")
      .eq("id", roomId)
      .single();

    if (roomError) throw roomError;

    if (room.type !== "group") {
      return NextResponse.json(
        { error: "1:1 대화방은 수정할 수 없습니다." },
        { status: 400 }
      );
    }

    // 업데이트
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (image_url !== undefined) updateData.image_url = image_url;

    const { data: updatedRoom, error: updateError } = await supabase
      .from("chat_rooms")
      .update(updateData)
      .eq("id", roomId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("대화방 수정 실패:", error);
    return NextResponse.json(
      { error: "대화방을 수정하는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/rooms/[roomId] - 대화방 나가기
 */
export async function DELETE(
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

    // 참여자 정보 확인
    const { data: participation, error: partError } = await supabase
      .from("chat_participants")
      .select("id, role")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .is("left_at", null)
      .single();

    if (partError || !participation) {
      return NextResponse.json(
        { error: "대화방에 참여하고 있지 않습니다." },
        { status: 400 }
      );
    }

    // 대화방 나가기 처리 (soft delete)
    const { error: leaveError } = await supabase
      .from("chat_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("id", participation.id);

    if (leaveError) throw leaveError;

    // 사용자 이름 조회
    const { data: user } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    // 시스템 메시지 추가
    await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: null,
      content: `${user?.name || "사용자"}님이 대화방을 나갔습니다.`,
      message_type: "system",
    });

    // admin이 나갔으면 다른 참여자에게 admin 권한 이전
    if (participation.role === "admin") {
      const { data: remainingParticipants } = await supabase
        .from("chat_participants")
        .select("id")
        .eq("room_id", roomId)
        .is("left_at", null)
        .order("joined_at", { ascending: true })
        .limit(1);

      if (remainingParticipants && remainingParticipants.length > 0) {
        await supabase
          .from("chat_participants")
          .update({ role: "admin" })
          .eq("id", remainingParticipants[0].id);
      }
    }

    return NextResponse.json({ success: true, message: "대화방을 나갔습니다." });
  } catch (error) {
    console.error("대화방 나가기 실패:", error);
    return NextResponse.json(
      { error: "대화방 나가기에 실패했습니다." },
      { status: 500 }
    );
  }
}
