"use client";

import { useState } from "react";
import { useChatSearch } from "@/hooks/chat";
import type { ChatMessageWithRelations } from "@/types/chat";

interface ChatSearchProps {
  roomId: string;
  userId: string;
  onMessageSelect: (messageId: string) => void;
  onClose: () => void;
}

export default function ChatSearch({
  roomId,
  userId,
  onMessageSelect,
  onClose,
}: ChatSearchProps) {
  const {
    searchQuery,
    setSearchQuery,
    results,
    total,
    hasMore,
    isLoading,
    loadMore,
    clearSearch,
  } = useChatSearch({ roomId, userId });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 검색어 하이라이트
  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-200">
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="메시지 검색..."
            className="w-full pl-10 pr-10 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm text-slate-400">2글자 이상 입력하세요</p>
          </div>
        ) : isLoading && results.length === 0 ? (
          <div className="flex justify-center py-8">
            <svg className="w-6 h-6 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 21a9 9 0 110-18 9 9 0 010 18z" />
            </svg>
            <p className="text-sm text-slate-400">검색 결과가 없습니다</p>
          </div>
        ) : (
          <>
            <div className="px-4 py-2 bg-slate-50 text-sm text-slate-400 border-b">
              {total}개의 결과
            </div>
            <div className="divide-y divide-slate-100">
              {results.map((message) => (
                <button
                  key={message.id}
                  onClick={() => onMessageSelect(message.id)}
                  className="w-full p-4 text-left hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3">
                    {/* 프로필 */}
                    {message.sender?.profile_image ? (
                      <img
                        src={message.sender.profile_image}
                        alt={message.sender.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-sky-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {message.sender?.name?.slice(0, 2) || "?"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-slate-800">
                          {message.sender?.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {highlightText(message.content || "", searchQuery)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* 더 보기 버튼 */}
            {hasMore && (
              <div className="p-4">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="w-full py-2 text-sm text-sky-600 hover:bg-sky-50 rounded-lg disabled:opacity-50"
                >
                  {isLoading ? "로딩 중..." : "더 보기"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
