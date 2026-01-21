import { useCallback, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { ChatTyping } from "@/types/chat";

interface TypingUser {
  user_id: string;
  name: string;
}

interface UseTypingIndicatorOptions {
  roomId: string | null;
  userId: string | null;
  debounceMs?: number;
}

interface UseTypingIndicatorReturn {
  typingUsers: TypingUser[];
  setIsTyping: (isTyping: boolean) => void;
}

export function useTypingIndicator({
  roomId,
  userId,
  debounceMs = 3000,
}: UseTypingIndicatorOptions): UseTypingIndicatorReturn {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Realtime 구독
  useEffect(() => {
    if (!roomId || !userId) return;

    const channel = supabase
      .channel(`typing:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "chat_typing",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            // 타이핑 종료
            setTypingUsers((prev) =>
              prev.filter((u) => u.user_id !== payload.old.user_id)
            );
          } else {
            // 타이핑 시작/업데이트
            const typingData = payload.new as ChatTyping;

            // 자신 제외
            if (typingData.user_id === userId) return;

            // 사용자 이름 조회
            const { data: user } = await supabase
              .from("users")
              .select("name")
              .eq("id", typingData.user_id)
              .single();

            if (user) {
              setTypingUsers((prev) => {
                const exists = prev.some((u) => u.user_id === typingData.user_id);
                if (exists) return prev;
                return [...prev, { user_id: typingData.user_id, name: user.name }];
              });

              // 3초 후 자동 제거
              setTimeout(() => {
                setTypingUsers((prev) =>
                  prev.filter((u) => u.user_id !== typingData.user_id)
                );
              }, 3000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  // 타이핑 상태 업데이트
  const setIsTyping = useCallback(
    (isTyping: boolean) => {
      if (!roomId || !userId) return;

      // 이전 타이머 취소
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // 상태가 변경되었을 때만 API 호출
      if (isTyping && !isTypingRef.current) {
        isTypingRef.current = true;
        fetch(`/api/chat/rooms/${roomId}/typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, is_typing: true }),
        }).catch(console.error);

        // 자동 종료 타이머
        typingTimeoutRef.current = setTimeout(() => {
          isTypingRef.current = false;
          fetch(`/api/chat/rooms/${roomId}/typing`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, is_typing: false }),
          }).catch(console.error);
        }, debounceMs);
      } else if (!isTyping && isTypingRef.current) {
        isTypingRef.current = false;
        fetch(`/api/chat/rooms/${roomId}/typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, is_typing: false }),
        }).catch(console.error);
      }
    },
    [roomId, userId, debounceMs]
  );

  // 언마운트 시 타이핑 상태 제거
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current && roomId && userId) {
        fetch(`/api/chat/rooms/${roomId}/typing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, is_typing: false }),
        }).catch(console.error);
      }
    };
  }, [roomId, userId]);

  return {
    typingUsers,
    setIsTyping,
  };
}
