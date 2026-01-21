import useSWR from "swr";
import type { TotalUnreadCount } from "@/types/chat";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseUnreadCountOptions {
  userId: string | null;
}

interface UseUnreadCountReturn {
  totalUnread: number;
  unreadByRoom: Array<{ room_id: string; count: number }>;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

export function useUnreadCount({
  userId,
}: UseUnreadCountOptions): UseUnreadCountReturn {
  const { data, error, isLoading, mutate } = useSWR<TotalUnreadCount>(
    userId ? `/api/chat/unread?userId=${userId}` : null,
    fetcher,
    {
      refreshInterval: 30000, // 30초마다 갱신
      revalidateOnFocus: true,
    }
  );

  return {
    totalUnread: data?.total || 0,
    unreadByRoom: data?.by_room || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}

// 특정 대화방의 안읽은 메시지 수 가져오기
export function useRoomUnreadCount(
  userId: string | null,
  roomId: string
): number {
  const { unreadByRoom } = useUnreadCount({ userId });
  const roomUnread = unreadByRoom.find((r) => r.room_id === roomId);
  return roomUnread?.count || 0;
}
