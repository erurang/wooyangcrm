import useSWR from "swr";
import { useState, useCallback } from "react";
import type { SearchMessagesResponse, ChatMessageWithRelations } from "@/types/chat";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseChatSearchOptions {
  roomId: string | null;
  userId: string | null;
}

interface UseChatSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  results: ChatMessageWithRelations[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isError: boolean;
  loadMore: () => void;
  clearSearch: () => void;
}

export function useChatSearch({
  roomId,
  userId,
}: UseChatSearchOptions): UseChatSearchReturn {
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const shouldFetch = roomId && userId && searchQuery.length >= 2;

  const { data, error, isLoading } = useSWR<SearchMessagesResponse>(
    shouldFetch
      ? `/api/chat/rooms/${roomId}/search?userId=${userId}&query=${encodeURIComponent(searchQuery)}&limit=${limit}&offset=${offset}`
      : null,
    fetcher
  );

  const loadMore = useCallback(() => {
    if (data?.has_more) {
      setOffset((prev) => prev + limit);
    }
  }, [data?.has_more]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setOffset(0);
  }, []);

  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setOffset(0); // 검색어 변경 시 offset 초기화
  }, []);

  return {
    searchQuery,
    setSearchQuery: handleSetSearchQuery,
    results: data?.messages || [],
    total: data?.total || 0,
    hasMore: data?.has_more || false,
    isLoading,
    isError: !!error,
    loadMore,
    clearSearch,
  };
}
