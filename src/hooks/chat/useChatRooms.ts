import useSWR from "swr";
import type { ChatRoomsResponse, ChatRoomWithRelations } from "@/types/chat";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseChatRoomsOptions {
  userId: string | null;
  search?: string;
}

interface UseChatRoomsReturn {
  rooms: ChatRoomWithRelations[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  mutate: () => void;
}

export function useChatRooms({
  userId,
  search = "",
}: UseChatRoomsOptions): UseChatRoomsReturn {
  const params = new URLSearchParams();
  if (userId) params.append("userId", userId);
  if (search) params.append("search", search);

  const { data, error, isLoading, mutate } = useSWR<ChatRoomsResponse>(
    userId ? `/api/chat/rooms?${params.toString()}` : null,
    fetcher,
    {
      refreshInterval: 30000, // 30초마다 갱신
      revalidateOnFocus: true,
    }
  );

  return {
    rooms: data?.rooms || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

interface UseCreateChatRoomReturn {
  createRoom: (params: {
    type: "direct" | "group";
    name?: string;
    participant_ids: string[];
    created_by: string;
  }) => Promise<ChatRoomWithRelations>;
  isLoading: boolean;
}

export function useCreateChatRoom(): UseCreateChatRoomReturn {
  const createRoom = async (params: {
    type: "direct" | "group";
    name?: string;
    participant_ids: string[];
    created_by: string;
  }): Promise<ChatRoomWithRelations> => {
    const res = await fetch("/api/chat/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "대화방 생성에 실패했습니다.");
    }

    return res.json();
  };

  return {
    createRoom,
    isLoading: false,
  };
}

interface UseChatRoomDetailReturn {
  room: ChatRoomWithRelations | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  mutate: () => void;
}

export function useChatRoomDetail(
  roomId: string | null,
  userId: string | null
): UseChatRoomDetailReturn {
  const { data, error, isLoading, mutate } = useSWR<ChatRoomWithRelations>(
    roomId && userId ? `/api/chat/rooms/${roomId}?userId=${userId}` : null,
    fetcher
  );

  return {
    room: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

interface UseLeaveChatRoomReturn {
  leaveRoom: (roomId: string, userId: string) => Promise<void>;
}

export function useLeaveChatRoom(): UseLeaveChatRoomReturn {
  const leaveRoom = async (roomId: string, userId: string): Promise<void> => {
    const res = await fetch(`/api/chat/rooms/${roomId}?userId=${userId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "대화방 나가기에 실패했습니다.");
    }
  };

  return {
    leaveRoom,
  };
}
