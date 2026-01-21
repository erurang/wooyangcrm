import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { ChatMessageWithRelations } from "@/types/chat";

/**
 * GET /api/chat/rooms/[roomId]/messages - 메시지 목록 조회 (커서 기반 페이지네이션)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const cursor = searchParams.get("cursor"); // 마지막 메시지 ID
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!userId) {
      return NextResponse.json(
        { error: "userId가 필요합니다." },
        { status: 400 }
      );
    }

    // 참여자인지 확인
    const { data: participation, error: partError } = await supabase
      .from("chat_participants")
      .select("id, last_read_at")
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

    // 메시지 조회 쿼리
    let query = supabase
      .from("chat_messages")
      .select(
        `
        *,
        sender:users!chat_messages_sender_id_fkey(id, name, position, level),
        files:chat_files(*),
        reactions:chat_reactions(id, emoji, user_id)
      `
      )
      .eq("room_id", roomId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit + 1); // 다음 페이지 여부 확인을 위해 +1

    // 커서가 있으면 해당 메시지 이전 것들만 조회
    if (cursor) {
      const { data: cursorMessage } = await supabase
        .from("chat_messages")
        .select("created_at")
        .eq("id", cursor)
        .single();

      if (cursorMessage) {
        query = query.lt("created_at", cursorMessage.created_at);
      }
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) throw messagesError;

    // 다음 페이지 여부 확인
    const hasMore = (messages?.length || 0) > limit;
    const messageList = hasMore ? messages?.slice(0, limit) : messages;

    // 반응 그룹화 처리
    const processedMessages: ChatMessageWithRelations[] = (messageList || []).map((msg) => {
      // 이모지별로 그룹화
      const reactionMap = new Map<string, { count: number; users: string[]; reacted_by_me: boolean }>();

      if (msg.reactions) {
        for (const reaction of msg.reactions) {
          const existing = reactionMap.get(reaction.emoji);
          if (existing) {
            existing.count++;
            existing.users.push(reaction.user_id);
            if (reaction.user_id === userId) existing.reacted_by_me = true;
          } else {
            reactionMap.set(reaction.emoji, {
              count: 1,
              users: [reaction.user_id],
              reacted_by_me: reaction.user_id === userId,
            });
          }
        }
      }

      const reactions = Array.from(reactionMap.entries()).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        users: [], // 필요시 사용자 정보 조회
        reacted_by_me: data.reacted_by_me,
      }));

      return {
        ...msg,
        reactions,
      };
    });

    // 시간순 정렬 (오래된 것 먼저)
    processedMessages.reverse();

    return NextResponse.json({
      messages: processedMessages,
      has_more: hasMore,
      next_cursor: hasMore && messageList?.length ? messageList[messageList.length - 1].id : undefined,
    });
  } catch (error) {
    console.error("메시지 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "메시지를 불러오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/rooms/[roomId]/messages - 메시지 전송
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { sender_id, content, message_type = "text", reply_to_id, file_ids } = body;

    if (!sender_id) {
      return NextResponse.json(
        { error: "sender_id가 필요합니다." },
        { status: 400 }
      );
    }

    if (!content && (!file_ids || file_ids.length === 0)) {
      return NextResponse.json(
        { error: "메시지 내용 또는 파일이 필요합니다." },
        { status: 400 }
      );
    }

    // 참여자인지 확인
    const { data: participation, error: partError } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", sender_id)
      .is("left_at", null)
      .single();

    if (partError || !participation) {
      return NextResponse.json(
        { error: "대화방에 참여하고 있지 않습니다." },
        { status: 403 }
      );
    }

    // 메시지 생성
    const { data: newMessage, error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        room_id: roomId,
        sender_id,
        content,
        message_type,
        reply_to_id: reply_to_id || null,
      })
      .select(
        `
        *,
        sender:users!chat_messages_sender_id_fkey(id, name, position, level)
      `
      )
      .single();

    if (messageError) throw messageError;

    // 파일 연결 (이미 업로드된 파일의 message_id 업데이트)
    if (file_ids && file_ids.length > 0) {
      await supabase
        .from("chat_files")
        .update({ message_id: newMessage.id })
        .in("id", file_ids);
    }

    // 답장 대상 메시지 조회
    let replyTo = null;
    if (reply_to_id) {
      const { data: replyMessage } = await supabase
        .from("chat_messages")
        .select(
          `
          id, content, sender_id,
          sender:users!chat_messages_sender_id_fkey(id, name)
        `
        )
        .eq("id", reply_to_id)
        .single();
      replyTo = replyMessage;
    }

    // 파일 정보 조회
    const { data: files } = await supabase
      .from("chat_files")
      .select("*")
      .eq("message_id", newMessage.id);

    // 타이핑 상태 삭제
    await supabase
      .from("chat_typing")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", sender_id);

    // 내 읽음 시간 업데이트
    await supabase
      .from("chat_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .eq("user_id", sender_id);

    // 다른 참여자들에게 알림 발송 (음소거 제외)
    const { data: otherParticipants } = await supabase
      .from("chat_participants")
      .select("user_id, is_muted")
      .eq("room_id", roomId)
      .neq("user_id", sender_id)
      .is("left_at", null);

    // 대화방 이름 조회
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("name, type")
      .eq("id", roomId)
      .single();

    const senderName = newMessage.sender?.name || "사용자";
    const roomName = room?.name || (room?.type === "direct" ? senderName : "그룹 채팅");
    const messagePreview = content?.length > 30 ? content.substring(0, 30) + "..." : content;

    // 알림 생성 (비동기로 처리, 실패해도 메시지 전송은 성공)
    if (otherParticipants && otherParticipants.length > 0) {
      const notifications = otherParticipants
        .filter((p) => !p.is_muted) // 음소거한 사용자 제외
        .map((p) => ({
          user_id: p.user_id,
          type: "chat_message",
          title: roomName,
          message: `${senderName}: ${messagePreview || "파일을 보냈습니다"}`,
          related_id: roomId,
          related_type: "chat_room",
          read: false,
        }));

      if (notifications.length > 0) {
        supabase.from("notifications").insert(notifications).then(() => {});
      }
    }

    return NextResponse.json(
      {
        ...newMessage,
        files: files || [],
        reactions: [],
        reply_to: replyTo,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("메시지 전송 실패:", error);
    return NextResponse.json(
      { error: "메시지를 전송하는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chat/rooms/[roomId]/messages - 메시지 수정
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { message_id, user_id, content } = body;

    if (!message_id || !user_id || !content) {
      return NextResponse.json(
        { error: "message_id, user_id, content가 필요합니다." },
        { status: 400 }
      );
    }

    // 본인 메시지인지 확인
    const { data: message, error: msgError } = await supabase
      .from("chat_messages")
      .select("sender_id")
      .eq("id", message_id)
      .eq("room_id", roomId)
      .single();

    if (msgError || !message) {
      return NextResponse.json(
        { error: "메시지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (message.sender_id !== user_id) {
      return NextResponse.json(
        { error: "본인 메시지만 수정할 수 있습니다." },
        { status: 403 }
      );
    }

    // 메시지 수정
    const { data: updatedMessage, error: updateError } = await supabase
      .from("chat_messages")
      .update({
        content,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", message_id)
      .select(
        `
        *,
        sender:users!chat_messages_sender_id_fkey(id, name, position, level)
      `
      )
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("메시지 수정 실패:", error);
    return NextResponse.json(
      { error: "메시지를 수정하는 데 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/rooms/[roomId]/messages - 메시지 삭제 (soft delete)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    const userId = searchParams.get("userId");

    if (!messageId || !userId) {
      return NextResponse.json(
        { error: "messageId와 userId가 필요합니다." },
        { status: 400 }
      );
    }

    // 본인 메시지인지 확인
    const { data: message, error: msgError } = await supabase
      .from("chat_messages")
      .select("sender_id")
      .eq("id", messageId)
      .eq("room_id", roomId)
      .single();

    if (msgError || !message) {
      return NextResponse.json(
        { error: "메시지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (message.sender_id !== userId) {
      return NextResponse.json(
        { error: "본인 메시지만 삭제할 수 있습니다." },
        { status: 403 }
      );
    }

    // 소프트 삭제
    const { error: deleteError } = await supabase
      .from("chat_messages")
      .update({
        is_deleted: true,
        content: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, message: "메시지가 삭제되었습니다." });
  } catch (error) {
    console.error("메시지 삭제 실패:", error);
    return NextResponse.json(
      { error: "메시지를 삭제하는 데 실패했습니다." },
      { status: 500 }
    );
  }
}
