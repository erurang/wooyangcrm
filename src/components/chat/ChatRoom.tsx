"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useChatMessages, useMarkAsRead, useTypingIndicator } from "@/hooks/chat";
import type { ChatRoomWithRelations, ChatMessageWithRelations, ChatFile, ChatNotificationSetting } from "@/types/chat";
import { getChatRoomDisplayName, formatMessageDate } from "@/types/chat";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import ChatRoomSettings from "./ChatRoomSettings";

interface ChatRoomProps {
  room: ChatRoomWithRelations;
  currentUserId: string;
  onBack?: () => void;
  onOpenInfo?: () => void;
  onOpenSearch?: () => void;
  onLeaveRoom?: () => void;
  onSettingsChange?: () => void;
}

export default function ChatRoom({
  room,
  currentUserId,
  onBack,
  onOpenInfo,
  onOpenSearch,
  onLeaveRoom,
  onSettingsChange,
}: ChatRoomProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<ChatMessageWithRelations | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessageWithRelations | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const {
    messages,
    hasMore,
    isLoading,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    mutate,
  } = useChatMessages({
    roomId: room.id,
    userId: currentUserId,
  });

  const { markAsRead } = useMarkAsRead(room.id, currentUserId);

  const { typingUsers, setIsTyping } = useTypingIndicator({
    roomId: room.id,
    userId: currentUserId,
  });

  // 읽음 처리
  useEffect(() => {
    markAsRead();
  }, [markAsRead, messages.length]);

  // 스크롤 하단 유지
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // 무한 스크롤
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current || isLoading || !hasMore) return;

    if (messagesContainerRef.current.scrollTop < 100) {
      loadMore();
    }
  }, [isLoading, hasMore, loadMore]);

  // 메시지 전송
  const handleSend = useCallback(
    async (content: string, replyToId?: string, fileIds?: string[]) => {
      await sendMessage({
        content,
        reply_to_id: replyToId,
        file_ids: fileIds,
      });
      scrollToBottom();
    },
    [sendMessage, scrollToBottom]
  );

  // 파일 업로드
  const handleFileUpload = useCallback(
    async (file: File): Promise<ChatFile | null> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", currentUserId);
      formData.append("roomId", room.id);

      const res = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) return null;

      const data = await res.json();
      return data.file;
    },
    [currentUserId, room.id]
  );

  // 이모지 반응
  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      await fetch(`/api/chat/rooms/${room.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          message_id: messageId,
          emoji,
        }),
      });
      mutate();
    },
    [room.id, currentUserId, mutate]
  );

  // 메시지로 스크롤 및 하이라이트
  const handleScrollToMessage = useCallback((messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      // 2초 후 하이라이트 해제
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2000);
    }
  }, []);

  // 대화방 나가기
  const handleLeaveRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/rooms/${room.id}?userId=${currentUserId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onLeaveRoom?.();
      } else {
        const data = await res.json();
        alert(data.error || "대화방 나가기에 실패했습니다.");
      }
    } catch (error) {
      console.error("대화방 나가기 실패:", error);
      alert("대화방 나가기에 실패했습니다.");
    }
  }, [room.id, currentUserId, onLeaveRoom]);

  // 메시지 그룹화 (날짜별, 연속 메시지)
  const groupedMessages = messages.reduce(
    (acc, message, index) => {
      const messageDate = new Date(message.created_at).toDateString();
      const prevMessage = messages[index - 1];
      const prevDate = prevMessage ? new Date(prevMessage.created_at).toDateString() : null;

      // 날짜가 바뀌면 날짜 구분선 추가
      if (messageDate !== prevDate) {
        acc.push({ type: "date" as const, date: message.created_at });
      }

      // 같은 사용자의 연속 메시지인지 확인 (5분 이내)
      const showAvatar =
        !prevMessage ||
        prevMessage.sender_id !== message.sender_id ||
        prevDate !== messageDate ||
        new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 5 * 60 * 1000;

      acc.push({ type: "message" as const, message, showAvatar });
      return acc;
    },
    [] as Array<
      | { type: "date"; date: string }
      | { type: "message"; message: ChatMessageWithRelations; showAvatar: boolean }
    >
  );

  // 읽음 상태 계산 (1:1 대화)
  const getReadStatus = useCallback(
    (message: ChatMessageWithRelations) => {
      if (message.sender_id !== currentUserId) return false;
      if (room.type !== "direct") return false;

      const otherParticipant = room.participants?.find((p) => p.user_id !== currentUserId);
      if (!otherParticipant?.last_read_at) return false;

      return new Date(otherParticipant.last_read_at) >= new Date(message.created_at);
    },
    [currentUserId, room.type, room.participants]
  );

  const displayName = getChatRoomDisplayName(room, currentUserId);
  const participantCount = room.participants?.length || 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        {/* 뒤로가기 (모바일) */}
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-gray-500 hover:text-gray-700 md:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* 프로필 이미지 */}
        <div className="flex-shrink-0">
          {room.type === "direct" && room.other_user?.profile_image ? (
            <img
              src={room.other_user.profile_image}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                room.type === "group"
                  ? "bg-gradient-to-br from-purple-500 to-pink-500"
                  : "bg-gradient-to-br from-blue-500 to-cyan-500"
              }`}
            >
              {room.type === "group" ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-6 8v-2c0-2.67 5.33-4 6-4h12c.67 0 6 1.33 6 4v2H6z" />
                </svg>
              ) : (
                displayName.slice(0, 2)
              )}
            </div>
          )}
        </div>

        {/* 대화방 정보 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{displayName}</h3>
          {room.type === "group" && (
            <p className="text-xs text-gray-500">참여자 {participantCount}명</p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSearch}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="대화 검색"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            onClick={onOpenInfo}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="대화방 정보"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <ChatRoomSettings
            roomId={room.id}
            currentUserId={currentUserId}
            currentNotificationSetting={(room.my_notification_setting as ChatNotificationSetting) || "all"}
            isPinned={room.my_is_pinned || false}
            onLeaveRoom={handleLeaveRoom}
            onSettingsChange={() => onSettingsChange?.()}
          />
        </div>
      </div>

      {/* 메시지 목록 */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {/* 더 불러오기 로딩 */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <svg className="w-6 h-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}

        {/* 메시지 렌더링 */}
        {groupedMessages.map((item, index) => {
          if (item.type === "date") {
            return (
              <div key={`date-${index}`} className="flex justify-center my-4">
                <span className="text-xs text-gray-500 bg-gray-100 px-4 py-1.5 rounded-full">
                  {formatMessageDate(item.date)}
                </span>
              </div>
            );
          }

          return (
            <ChatMessage
              key={item.message.id}
              message={item.message}
              isOwn={item.message.sender_id === currentUserId}
              isRead={getReadStatus(item.message)}
              showAvatar={item.showAvatar}
              isHighlighted={highlightedMessageId === item.message.id}
              onReply={setReplyTo}
              onEdit={setEditingMessage}
              onDelete={deleteMessage}
              onReaction={handleReaction}
              onScrollToMessage={handleScrollToMessage}
            />
          );
        })}

        {/* 타이핑 인디케이터 */}
        {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
      </div>

      {/* 입력창 */}
      <ChatInput
        onSend={handleSend}
        onTyping={setIsTyping}
        onFileUpload={handleFileUpload}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
