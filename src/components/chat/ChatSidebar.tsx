"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatMessageTime, getChatRoomDisplayName } from "@/types/chat";
import type { ChatRoomWithRelations } from "@/types/chat";

interface ChatSidebarProps {
  rooms: ChatRoomWithRelations[];
  currentRoomId: string | null;
  currentUserId: string;
  isLoading: boolean;
  onRoomSelect: (roomId: string) => void;
  onNewChat: () => void;
  onSearch: (query: string) => void;
}

export default function ChatSidebar({
  rooms,
  currentRoomId,
  currentUserId,
  isLoading,
  onRoomSelect,
  onNewChat,
  onSearch,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">메신저</h2>
          <button
            onClick={onNewChat}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="새 대화"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* 검색 */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="대화방 검색..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg text-sm focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* 대화방 목록 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-gray-500 text-sm">대화가 없습니다</p>
            <button
              onClick={onNewChat}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              새 대화 시작하기
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {rooms.map((room) => (
              <ChatRoomItem
                key={room.id}
                room={room}
                currentUserId={currentUserId}
                isActive={room.id === currentRoomId}
                onClick={() => onRoomSelect(room.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

interface ChatRoomItemProps {
  room: ChatRoomWithRelations;
  currentUserId: string;
  isActive: boolean;
  onClick: () => void;
}

function ChatRoomItem({ room, currentUserId, isActive, onClick }: ChatRoomItemProps) {
  const displayName = getChatRoomDisplayName(room, currentUserId);
  const unreadCount = room.unread_count || 0;
  const isPinned = room.my_is_pinned || false;

  // 프로필 이미지 또는 이니셜
  const getInitials = (name: string) => {
    return name.slice(0, 2);
  };

  // 1:1 대화의 경우 상대방 프로필, 그룹은 방 이미지 또는 기본 아이콘
  const profileImage = room.type === "direct" ? room.other_user?.profile_image : room.image_url;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors ${
        isActive ? "bg-blue-50 border-r-2 border-blue-600" : ""
      }`}
    >
      {/* 프로필 이미지 */}
      <div className="relative flex-shrink-0">
        {profileImage ? (
          <img
            src={profileImage}
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
              room.type === "group" ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-gradient-to-br from-blue-500 to-cyan-500"
            }`}
          >
            {room.type === "group" ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-6 8v-2c0-2.67 5.33-4 6-4h12c.67 0 6 1.33 6 4v2H6z" />
              </svg>
            ) : (
              getInitials(displayName)
            )}
          </div>
        )}

        {/* 안읽음 배지 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {/* 대화 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 min-w-0">
            {isPinned && (
              <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )}
            <span className={`font-medium truncate ${isActive ? "text-blue-600" : "text-gray-900"}`}>
              {displayName}
            </span>
          </div>
          {room.last_message_at && (
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {formatMessageTime(room.last_message_at)}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">
          {room.last_message_preview || "대화를 시작하세요"}
        </p>
      </div>
    </motion.button>
  );
}
