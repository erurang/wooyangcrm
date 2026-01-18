"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface NotificationBellProps {
  userId: string | undefined;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(userId);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 알림 클릭 핸들러
  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);

    // 관련 페이지로 이동
    if (notification.related_id && notification.related_type) {
      switch (notification.related_type) {
        case "document":
          router.push(`/documents/review?highlight=${notification.related_id}`);
          break;
        case "consultation":
          router.push(`/consultations/${notification.related_id}`);
          break;
        case "todo":
          router.push("/");
          break;
        case "post":
          // related_id가 "postId:commentId" 형식일 수 있음 (멘션 알림)
          if (notification.related_id?.includes(":")) {
            const [postId, commentId] = notification.related_id.split(":");
            router.push(`/board/${postId}?commentId=${commentId}`);
          } else {
            router.push(`/board/${notification.related_id}`);
          }
          break;
        case "inventory_task":
          // 재고 작업 알림 - task_type에 따라 입고/출고 페이지로 이동
          if (notification.type === "inventory_assignment" || notification.type === "inventory_update" || notification.type === "inventory_complete") {
            // 알림 메시지에서 입고/출고 판단 (메시지에 "입고" 또는 "출고" 포함)
            const isInbound = notification.message?.includes("입고") || notification.title?.includes("입고");
            const targetPage = isInbound ? "/inventory/inbound" : "/inventory/outbound";
            router.push(`${targetPage}?highlight=${notification.related_id}`);
          }
          break;
        case "work_order":
          router.push(`/production/work-orders/${notification.related_id}`);
          break;
      }
    }
    setIsOpen(false);
  };

  // 알림 타입별 아이콘
  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "document_expiry":
        return "📄";
      case "consultation_followup":
        return "💬";
      case "todo_reminder":
        return "✅";
      case "post_comment":
        return "💬";
      case "post_mention":
        return "@";
      case "inventory_assignment":
        return "📦";
      case "inventory_update":
        return "📝";
      case "inventory_complete":
        return "✅";
      case "work_order_assignment":
        return "📋";
      case "work_order_unassignment":
        return "🚫";
      case "work_order_comment":
        return "💬";
      case "work_order_update":
        return "✏️";
      case "work_order_status":
        return "🔄";
      case "work_order_deadline":
        return "⏰";
      case "work_order_progress":
        return "📊";
      case "work_order_completed":
        return "✅";
      case "work_order_file":
        return "📎";
      default:
        return "🔔";
    }
  };

  // 알림 타입별 색상
  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "document_expiry":
        return "bg-red-50 border-red-200";
      case "consultation_followup":
        return "bg-blue-50 border-blue-200";
      case "todo_reminder":
        return "bg-yellow-50 border-yellow-200";
      case "post_comment":
        return "bg-green-50 border-green-200";
      case "post_mention":
        return "bg-purple-50 border-purple-200";
      case "inventory_assignment":
        return "bg-green-50 border-green-200";
      case "inventory_update":
        return "bg-blue-50 border-blue-200";
      case "inventory_complete":
        return "bg-emerald-50 border-emerald-200";
      case "work_order_assignment":
        return "bg-purple-50 border-purple-200";
      case "work_order_unassignment":
        return "bg-gray-50 border-gray-200";
      case "work_order_comment":
        return "bg-blue-50 border-blue-200";
      case "work_order_update":
        return "bg-indigo-50 border-indigo-200";
      case "work_order_status":
        return "bg-orange-50 border-orange-200";
      case "work_order_deadline":
        return "bg-yellow-50 border-yellow-200";
      case "work_order_progress":
        return "bg-cyan-50 border-cyan-200";
      case "work_order_completed":
        return "bg-green-50 border-green-200";
      case "work_order_file":
        return "bg-slate-50 border-slate-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 벨 아이콘 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="알림"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* 읽지 않은 알림 배지 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 패널 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-800">알림</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  모두 읽음
                </button>
              )}
            </div>

            {/* 알림 목록 */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">로딩 중...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-300 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <p className="text-sm">알림이 없습니다</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      p-3 border-b border-gray-100 cursor-pointer
                      hover:bg-gray-50 transition-colors
                      ${!notification.read ? "bg-indigo-50/50" : ""}
                    `}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* 타입 아이콘 */}
                      <span
                        className={`
                          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
                          ${getTypeColor(notification.type)}
                        `}
                      >
                        {getTypeIcon(notification.type)}
                      </span>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </p>
                      </div>

                      {/* 읽지 않음 표시 */}
                      {!notification.read && (
                        <span className="flex-shrink-0 w-2 h-2 bg-indigo-500 rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
