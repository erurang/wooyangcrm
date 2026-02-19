"use client";

import { useState, useCallback } from "react";
import type { ChatMessageWithRelations, ChatReactionGroup } from "@/types/chat";
import { COMMON_EMOJIS, formatFileSize, isImageFile } from "@/types/chat";

interface ChatMessageProps {
  message: ChatMessageWithRelations;
  isOwn: boolean;
  isRead?: boolean;
  showAvatar?: boolean;
  isHighlighted?: boolean;
  onReply?: (message: ChatMessageWithRelations) => void;
  onEdit?: (message: ChatMessageWithRelations) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onScrollToMessage?: (messageId: string) => void;
}

export default function ChatMessage({
  message,
  isOwn,
  isRead = false,
  showAvatar = true,
  isHighlighted = false,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onScrollToMessage,
}: ChatMessageProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // 우클릭 메뉴
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // 메시지 복사
  const handleCopy = useCallback(() => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
    }
    setContextMenu(null);
  }, [message.content]);

  // 답장
  const handleReply = useCallback(() => {
    onReply?.(message);
    setContextMenu(null);
  }, [message, onReply]);

  // 컨텍스트 메뉴 닫기
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 시스템 메시지
  if (message.message_type === "system") {
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  // 삭제된 메시지
  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
        <div className="px-4 py-2 bg-slate-100 rounded-lg text-slate-400 italic text-sm">
          삭제된 메시지입니다
        </div>
      </div>
    );
  }

  const messageTime = new Date(message.created_at).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
    {/* 우클릭 컨텍스트 메뉴 */}
    {contextMenu && (
      <>
        <div
          className="fixed inset-0 z-50"
          onClick={closeContextMenu}
        />
        <div
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[120px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={handleCopy}
            className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            복사
          </button>
          <button
            onClick={handleReply}
            className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            답장
          </button>
          {isOwn && (
            <>
              <hr className="my-1 border-slate-200" />
              <button
                onClick={() => {
                  onEdit?.(message);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                수정
              </button>
              <button
                onClick={() => {
                  onDelete?.(message.id);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-100 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                삭제
              </button>
            </>
          )}
        </div>
      </>
    )}
    <div
      id={`message-${message.id}`}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2 group transition-all duration-500 rounded-lg ${
        isHighlighted ? "bg-yellow-100 -mx-2 px-2 py-1" : ""
      }`}
      onMouseLeave={() => {
        setShowMenu(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* 상대방 아바타 */}
      {!isOwn && showAvatar && (
        <div className="flex-shrink-0 mr-2">
          {message.sender?.profile_image ? (
            <img
              src={message.sender.profile_image}
              alt={message.sender.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-sky-500 flex items-center justify-center text-white text-xs font-semibold">
              {message.sender?.name?.slice(0, 2) || "?"}
            </div>
          )}
        </div>
      )}

      <div className={`max-w-[70%] ${!isOwn && !showAvatar ? "ml-10" : ""}`}>
        {/* 보낸 사람 이름 (상대방 메시지만) */}
        {!isOwn && showAvatar && (
          <p className="text-xs text-slate-400 mb-1">{message.sender?.name}</p>
        )}

        {/* 메시지 + 액션 메뉴 */}
        <div className={`relative flex items-end gap-1 ${isOwn ? "flex-row-reverse" : ""}`}>
          {/* 메시지 버블 */}
          <div
            className={`relative px-4 py-2 rounded-2xl cursor-pointer ${
              isOwn
                ? "bg-sky-600 text-white rounded-br-md"
                : "bg-slate-100 text-slate-800 rounded-bl-md"
            }`}
            onContextMenu={handleContextMenu}
          >
            {/* 답장 대상 표시 */}
            {message.reply_to && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (message.reply_to?.id) {
                    onScrollToMessage?.(message.reply_to.id);
                  }
                }}
                className={`mb-2 pb-2 border-b cursor-pointer hover:opacity-80 transition-opacity ${
                  isOwn ? "border-sky-400/50" : "border-slate-200"
                }`}
              >
                <p className={`text-xs ${isOwn ? "text-sky-200" : "text-slate-400"}`}>
                  {message.reply_to.sender?.name}에게 답장
                </p>
                <p
                  className={`text-xs truncate ${
                    isOwn ? "text-sky-100" : "text-slate-400"
                  }`}
                >
                  {message.reply_to.content}
                </p>
              </div>
            )}

            {/* 텍스트 내용 */}
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}

            {/* 파일/이미지 */}
            {message.files && message.files.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.files.map((file) =>
                  isImageFile(file.file_type) ? (
                    <a
                      key={file.id}
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={file.thumbnail_url || file.file_url}
                        alt={file.file_name}
                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90"
                      />
                    </a>
                  ) : (
                    <a
                      key={file.id}
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        isOwn ? "bg-sky-500" : "bg-white border border-slate-200"
                      }`}
                    >
                      <svg
                        className={`w-8 h-8 ${isOwn ? "text-white" : "text-slate-400"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            isOwn ? "text-white" : "text-slate-800"
                          }`}
                        >
                          {file.file_name}
                        </p>
                        <p
                          className={`text-xs ${isOwn ? "text-sky-200" : "text-slate-400"}`}
                        >
                          {formatFileSize(file.file_size)}
                        </p>
                      </div>
                    </a>
                  )
                )}
              </div>
            )}

            {/* 수정됨 표시 */}
            {message.is_edited && (
              <span
                className={`text-xs mt-1 block ${isOwn ? "text-sky-200" : "text-slate-400"}`}
              >
                (수정됨)
              </span>
            )}
          </div>

          {/* 시간 + 읽음 표시 */}
          <div className={`flex flex-col items-end gap-0.5 ${isOwn ? "mr-1" : "ml-1"}`}>
            {isOwn && (
              <span className={`text-xs ${isRead ? "text-sky-500" : "text-slate-400"}`}>
                {isRead ? "읽음" : "안읽음"}
              </span>
            )}
            <span className="text-xs text-slate-400">{messageTime}</span>
          </div>

          {/* 액션 버튼 (호버 시) */}
          <div
            className={`absolute top-0 ${
              isOwn ? "left-0 -translate-x-full pr-2" : "right-0 translate-x-full pl-2"
            } opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}
          >
            {/* 이모지 반응 */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded"
              title="반응 추가"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* 답장 */}
            <button
              onClick={() => onReply?.(message)}
              className="p-1 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded"
              title="답장"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>

            {/* 더보기 메뉴 */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded"
              title="더보기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            {/* 더보기 드롭다운 */}
            {showMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[100px]">
                {isOwn && (
                  <>
                    <button
                      onClick={() => {
                        onEdit?.(message);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        onDelete?.(message.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-100"
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            )}

            {/* 이모지 피커 */}
            {showEmojiPicker && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-10">
                <div className="flex gap-1">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReaction?.(message.id, emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 반응 표시 */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : ""}`}>
            {message.reactions.map((reaction: ChatReactionGroup) => (
              <button
                key={reaction.emoji}
                onClick={() => onReaction?.(message.id, reaction.emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${
                  reaction.reacted_by_me
                    ? "bg-sky-50 border-sky-200 text-sky-600"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                } hover:bg-slate-100`}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
