import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * POST /api/chat/rooms/[roomId]/reactions - 이모지 반응 추가
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await req.json();
    const { user_id, message_id, emoji } = body;

    if (!user_id || !message_id || !emoji) {
      return NextResponse.json(
        { error: "user_id, message_id, emoji가 필요합니다." },
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

    // 메시지가 해당 대화방 것인지 확인
    const { data: message, error: msgError } = await supabase
      .from("chat_messages")
      .select("id")
      .eq("id", message_id)
      .eq("room_id", roomId)
      .single();

    if (msgError || !message) {
      return NextResponse.json(
        { error: "메시지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미 같은 이모지 반응이 있는지 확인
    const { data: existingReaction } = await supabase
      .from("chat_reactions")
      .select("id")
      .eq("message_id", message_id)
      .eq("user_id", user_id)
      .eq("emoji", emoji)
      .single();

    if (existingReaction) {
      // 이미 있으면 삭제 (토글)
      const { error: deleteError } = await supabase
        .from("chat_reactions")
        .delete()
        .eq("id", existingReaction.id);

      if (deleteError) throw deleteError;

      return NextResponse.json({
        action: "removed",
        message: "반응이 제거되었습니다.",
      });
    }

    // 새 반응 추가
    const { data: newReaction, error: insertError } = await supabase
      .from("chat_reactions")
      .insert({
        message_id,
        user_id,
        emoji,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(
      {
        action: "added",
        reaction: newReaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("반응 추가 실패:", error);
    return NextResponse.json(
      { error: "반응 추가에 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/rooms/[roomId]/reactions - 메시지 반응 조회
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const messageId = searchParams.get("messageId");

    if (!userId || !messageId) {
      return NextResponse.json(
        { error: "userId와 messageId가 필요합니다." },
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

    // 반응 목록 조회
    const { data: reactions, error: reactionsError } = await supabase
      .from("chat_reactions")
      .select(
        `
        id, emoji, user_id, created_at,
        user:users(id, name)
      `
      )
      .eq("message_id", messageId)
      .order("created_at", { ascending: true });

    if (reactionsError) throw reactionsError;

    // 이모지별로 그룹화
    const groupedReactions = (reactions || []).reduce(
      (acc, reaction) => {
        const existing = acc.find((r) => r.emoji === reaction.emoji);
        if (existing) {
          existing.count++;
          existing.users.push(reaction.user);
          if (reaction.user_id === userId) existing.reacted_by_me = true;
        } else {
          acc.push({
            emoji: reaction.emoji,
            count: 1,
            users: [reaction.user],
            reacted_by_me: reaction.user_id === userId,
          });
        }
        return acc;
      },
      [] as Array<{
        emoji: string;
        count: number;
        users: unknown[];
        reacted_by_me: boolean;
      }>
    );

    return NextResponse.json({
      reactions: groupedReactions,
    });
  } catch (error) {
    console.error("반응 조회 실패:", error);
    return NextResponse.json(
      { error: "반응 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}
