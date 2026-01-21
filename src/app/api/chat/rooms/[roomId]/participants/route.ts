import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/chat/rooms/[roomId]/participants - 참여자 목록 조회
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

    // 본인이 참여자인지 확인
    const { data: myParticipation, error: partError } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .is("left_at", null)
      .single();

    if (partError || !myParticipation) {
      return NextResponse.json(
        { error: "대화방에 접근할 수 없습니다." },
        { status: 403 }
      );
    }

    // 참여자 목록 조회
    const { data: participants, error: listError } = await supabase
      .from("chat_participants")
      .select(
        `
        id, user_id, role, joined_at, last_read_at, is_muted, notification_setting, is_pinned,
        user:users(id, name, position, level)
      `
      )
      .eq("room_id", roomId)
      .is("left_at", null)
      .order("joined_at", { ascending: true });

    if (listError) throw listError;

    return NextResponse.json({
      participants: participants || [],
      total: participants?.length || 0,
    });
  } catch (error) {
    console.error("참여자 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "참여자 목록을 불러오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/rooms/[roomId]/participants - 사용자 초대
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { inviter_id, user_ids } = body;

    if (!inviter_id || !user_ids || user_ids.length === 0) {
      return NextResponse.json(
        { error: "inviter_id와 user_ids가 필요합니다." },
        { status: 400 }
      );
    }

    // 대화방 정보 및 초대자 권한 확인
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select("type")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: "대화방을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 1:1 대화방은 초대 불가
    if (room.type === "direct") {
      return NextResponse.json(
        { error: "1:1 대화방에는 사용자를 초대할 수 없습니다." },
        { status: 400 }
      );
    }

    // 초대자가 참여자인지 확인
    const { data: inviterParticipation, error: inviterError } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", inviter_id)
      .is("left_at", null)
      .single();

    if (inviterError || !inviterParticipation) {
      return NextResponse.json(
        { error: "대화방에 참여하고 있지 않습니다." },
        { status: 403 }
      );
    }

    // 이미 참여 중인 사용자 확인
    const { data: existingParticipants } = await supabase
      .from("chat_participants")
      .select("user_id")
      .eq("room_id", roomId)
      .in("user_id", user_ids)
      .is("left_at", null);

    const existingUserIds = new Set(existingParticipants?.map((p) => p.user_id) || []);
    const newUserIds = user_ids.filter((id: string) => !existingUserIds.has(id));

    if (newUserIds.length === 0) {
      return NextResponse.json(
        { error: "모든 사용자가 이미 대화방에 참여 중입니다." },
        { status: 400 }
      );
    }

    // 새 참여자 추가
    const newParticipants = newUserIds.map((userId: string) => ({
      room_id: roomId,
      user_id: userId,
      role: "member",
    }));

    const { error: insertError } = await supabase
      .from("chat_participants")
      .insert(newParticipants);

    if (insertError) throw insertError;

    // 초대된 사용자 이름 조회
    const { data: invitedUsers } = await supabase
      .from("users")
      .select("name")
      .in("id", newUserIds);

    const { data: inviter } = await supabase
      .from("users")
      .select("name")
      .eq("id", inviter_id)
      .single();

    // 시스템 메시지 추가
    const invitedNames = invitedUsers?.map((u) => u.name).join(", ") || "사용자";
    await supabase.from("chat_messages").insert({
      room_id: roomId,
      sender_id: null,
      content: `${inviter?.name || "관리자"}님이 ${invitedNames}님을 초대했습니다.`,
      message_type: "system",
    });

    // 대화방 이름 조회
    const { data: roomInfo } = await supabase
      .from("chat_rooms")
      .select("name")
      .eq("id", roomId)
      .single();

    // 초대된 사용자들에게 알림 발송
    const inviteNotifications = newUserIds.map((userId: string) => ({
      user_id: userId,
      type: "chat_invite",
      title: "채팅방 초대",
      message: `${inviter?.name || "관리자"}님이 "${roomInfo?.name || "그룹 채팅"}"에 초대했습니다.`,
      related_id: roomId,
      related_type: "chat_room",
      read: false,
    }));

    if (inviteNotifications.length > 0) {
      supabase.from("notifications").insert(inviteNotifications).then(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        invited_count: newUserIds.length,
        message: `${newUserIds.length}명이 초대되었습니다.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("사용자 초대 실패:", error);
    return NextResponse.json(
      { error: "사용자를 초대하는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chat/rooms/[roomId]/participants - 참여자 설정 변경 (알림 설정, 핀 등)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { user_id, is_muted, notification_setting, is_pinned } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id가 필요합니다." },
        { status: 400 }
      );
    }

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {};
    if (is_muted !== undefined) updateData.is_muted = is_muted;
    if (notification_setting !== undefined) updateData.notification_setting = notification_setting;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "변경할 필드가 없습니다." },
        { status: 400 }
      );
    }

    // 본인 참여 정보 업데이트
    const { data: updatedParticipation, error: updateError } = await supabase
      .from("chat_participants")
      .update(updateData)
      .eq("room_id", roomId)
      .eq("user_id", user_id)
      .is("left_at", null)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedParticipation);
  } catch (error) {
    console.error("참여자 설정 변경 실패:", error);
    return NextResponse.json(
      { error: "설정을 변경하는 데 실패했습니다." },
      { status: 500 }
    );
  }
}
