"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ChatNotificationSetting } from "@/types/chat";
import { NOTIFICATION_SETTING_LABELS } from "@/types/chat";

interface ChatRoomSettingsProps {
  roomId: string;
  currentUserId: string;
  currentNotificationSetting: ChatNotificationSetting;
  isPinned: boolean;
  onLeaveRoom: () => void;
  onSettingsChange: () => void;
}

export default function ChatRoomSettings({
  roomId,
  currentUserId,
  currentNotificationSetting,
  isPinned,
  onLeaveRoom,
  onSettingsChange,
}: ChatRoomSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowNotificationMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 알림 설정 변경
  const handleNotificationChange = useCallback(
    async (setting: ChatNotificationSetting) => {
      if (isUpdating) return;
      setIsUpdating(true);

      try {
        const res = await fetch(`/api/chat/rooms/${roomId}/participants`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUserId,
            notification_setting: setting,
          }),
        });

        if (res.ok) {
          onSettingsChange();
          setShowNotificationMenu(false);
          setIsOpen(false);
        }
      } catch (error) {
        console.error("알림 설정 변경 실패:", error);
      } finally {
        setIsUpdating(false);
      }
    },
    [roomId, currentUserId, isUpdating, onSettingsChange]
  );

  // 핀 설정 토글
  const handleTogglePin = useCallback(async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/participants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          is_pinned: !isPinned,
        }),
      });

      if (res.ok) {
        onSettingsChange();
        setIsOpen(false);
      }
    } catch (error) {
      console.error("핀 설정 변경 실패:", error);
    } finally {
      setIsUpdating(false);
    }
  }, [roomId, currentUserId, isPinned, isUpdating, onSettingsChange]);

  // 대화방 나가기
  const handleLeaveRoom = useCallback(() => {
    if (confirm("정말로 대화방을 나가시겠습니까?")) {
      onLeaveRoom();
      setIsOpen(false);
    }
  }, [onLeaveRoom]);

  return (
    <div className="relative">
      {/* 메뉴 버튼 */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
        title="설정"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
        >
          {/* 알림 설정 */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="w-full px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <div>
                  <div>알림 설정</div>
                  <div className="text-xs text-slate-400">
                    {NOTIFICATION_SETTING_LABELS[currentNotificationSetting]}
                  </div>
                </div>
              </div>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${showNotificationMenu ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* 알림 설정 서브메뉴 */}
            {showNotificationMenu && (
              <div className="border-t border-slate-100 bg-slate-50">
                <div className="px-4 py-2 text-xs text-slate-400">
                  알림 받을 메시지를 선택하세요
                </div>
                {(["all", "mentions", "none"] as ChatNotificationSetting[]).map((setting) => (
                  <button
                    key={setting}
                    onClick={() => handleNotificationChange(setting)}
                    disabled={isUpdating}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                      currentNotificationSetting === setting
                        ? "text-sky-600 bg-sky-50"
                        : "text-slate-600 hover:bg-slate-100"
                    } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      currentNotificationSetting === setting ? "border-sky-600" : "border-slate-300"
                    }`}>
                      {currentNotificationSetting === setting && (
                        <span className="w-2 h-2 bg-sky-600 rounded-full" />
                      )}
                    </span>
                    {NOTIFICATION_SETTING_LABELS[setting]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100" />

          {/* 핀 설정 */}
          <button
            onClick={handleTogglePin}
            disabled={isUpdating}
            className={`w-full px-4 py-3 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-3 ${
              isUpdating ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <svg className="w-5 h-5 text-slate-400" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {isPinned ? "상단 고정 해제" : "상단 고정"}
          </button>

          <div className="border-t border-slate-100" />

          {/* 나가기 */}
          <button
            onClick={handleLeaveRoom}
            className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            대화방 나가기
          </button>
        </div>
      )}
    </div>
  );
}
