import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { useCallback, useEffect, useState } from "react";
import type {
  ChatMessagesResponse,
  ChatMessageWithRelations,
  SendMessageRequest,
} from "@/types/chat";
import { supabase } from "@/lib/supabaseClient";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseChatMessagesOptions {
  roomId: string | null;
  userId: string | null;
  limit?: number;
}

interface UseChatMessagesReturn {
  messages: ChatMessageWithRelations[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  isError: boolean;
  error: Error | null;
  loadMore: () => void;
  sendMessage: (params: SendMessageRequest) => Promise<ChatMessageWithRelations>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  mutate: () => void;
}

export function useChatMessages({
  roomId,
  userId,
  limit = 50,
}: UseChatMessagesOptions): UseChatMessagesReturn {
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessageWithRelations[]>([]);

  // SWR Infinite 사용하여 페이지네이션
  const getKey = (pageIndex: number, previousPageData: ChatMessagesResponse | null) => {
    if (!roomId || !userId) return null;
    if (previousPageData && !previousPageData.has_more) return null;

    const params = new URLSearchParams();
    params.append("userId", userId);
    params.append("limit", String(limit));

    if (previousPageData?.next_cursor) {
      params.append("cursor", previousPageData.next_cursor);
    }

    return `/api/chat/rooms/${roomId}/messages?${params.toString()}`;
  };

  const {
    data,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
    mutate,
  } = useSWRInfinite<ChatMessagesResponse>(getKey, fetcher, {
    revalidateFirstPage: false,
    revalidateOnFocus: false,
  });

  // 모든 페이지의 메시지 합치기
  const allMessages = data?.flatMap((page) => page.messages) || [];
  const hasMore = data?.[data.length - 1]?.has_more ?? false;

  // Realtime 구독
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // 새 메시지 - sender 정보 포함해서 조회
          const { data: newMessage } = await supabase
            .from("chat_messages")
            .select(
              `
              *,
              sender:users!chat_messages_sender_id_fkey(id, name, position, level)
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            setRealtimeMessages((prev) => {
              // 중복 방지
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, { ...newMessage, reactions: [], files: [] }];
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // 메시지 수정/삭제
          setRealtimeMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
          );
          mutate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, mutate]);

  // 메시지 전송
  const sendMessage = useCallback(
    async (params: SendMessageRequest): Promise<ChatMessageWithRelations> => {
      if (!roomId || !userId) throw new Error("대화방 또는 사용자 정보가 없습니다.");

      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: userId,
          ...params,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "메시지 전송에 실패했습니다.");
      }

      const newMessage = await res.json();
      return newMessage;
    },
    [roomId, userId]
  );

  // 메시지 수정
  const editMessage = useCallback(
    async (messageId: string, content: string): Promise<void> => {
      if (!roomId || !userId) throw new Error("대화방 또는 사용자 정보가 없습니다.");

      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: messageId,
          user_id: userId,
          content,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "메시지 수정에 실패했습니다.");
      }

      mutate();
    },
    [roomId, userId, mutate]
  );

  // 메시지 삭제
  const deleteMessage = useCallback(
    async (messageId: string): Promise<void> => {
      if (!roomId || !userId) throw new Error("대화방 또는 사용자 정보가 없습니다.");

      const res = await fetch(
        `/api/chat/rooms/${roomId}/messages?messageId=${messageId}&userId=${userId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "메시지 삭제에 실패했습니다.");
      }

      mutate();
    },
    [roomId, userId, mutate]
  );

  // 더 보기
  const loadMore = useCallback(() => {
    if (hasMore && !isValidating) {
      setSize(size + 1);
    }
  }, [hasMore, isValidating, size, setSize]);

  // allMessages + realtimeMessages 합치기 (중복 제거)
  const combinedMessages = [
    ...allMessages,
    ...realtimeMessages.filter((rm) => !allMessages.some((m) => m.id === rm.id)),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return {
    messages: combinedMessages,
    hasMore,
    isLoading,
    isLoadingMore: isValidating && size > 1,
    isError: !!error,
    error,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    mutate: () => {
      setRealtimeMessages([]);
      mutate();
    },
  };
}

// 읽음 처리 훅
interface UseMarkAsReadReturn {
  markAsRead: () => Promise<void>;
}

export function useMarkAsRead(
  roomId: string | null,
  userId: string | null
): UseMarkAsReadReturn {
  const markAsRead = useCallback(async () => {
    if (!roomId || !userId) return;

    try {
      await fetch(`/api/chat/rooms/${roomId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
    } catch (error) {
      console.error("읽음 처리 실패:", error);
    }
  }, [roomId, userId]);

  return { markAsRead };
}
