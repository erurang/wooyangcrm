"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff } from "lucide-react";
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
    total,
    hasMore,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(userId, { limit: 10 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);

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
          if (notification.related_id?.includes(":")) {
            const [postId, commentId] = notification.related_id.split(":");
            router.push(`/board/${postId}?commentId=${commentId}`);
          } else {
            router.push(`/board/${notification.related_id}`);
          }
          break;
        case "inventory_task":
          if (notification.type === "inventory_assignment" || notification.type === "inventory_update" || notification.type === "inventory_complete" || notification.type === "inventory_cancel") {
            const isInbound = notification.message?.includes("입고") || notification.title?.includes("입고");
            const targetPage = isInbound ? "/inventory/inbound" : "/inventory/outbound";
            router.push(`${targetPage}?highlight=${notification.related_id}`);
          }
          break;
        case "inbound":
          router.push(`/inventory/inbound?highlight=${notification.related_id}`);
          break;
        case "outbound":
          router.push(`/inventory/outbound?highlight=${notification.related_id}`);
          break;
        case "work_order":
          router.push(`/production/work-orders/${notification.related_id}`);
          break;
      }
    }
    setIsOpen(false);
  };

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "document_expiry": return "📄";
      case "estimate_completed": return "📤";
      case "order_completed": return "📥";
      case "consultation_followup": return "💬";
      case "todo_reminder": return "✅";
      case "post_comment": return "💬";
      case "post_mention": return "@";
      case "post_reply": return "↩️";
      case "inventory_assignment": return "📦";
      case "inventory_update": return "📝";
      case "inventory_complete": return "✅";
      case "inventory_cancel": return "❌";
      case "inbound_assignment": return "📥";
      case "inbound_date_change": return "📅";
      case "inbound_confirmed": return "✅";
      case "inbound_canceled": return "❌";
      case "outbound_assignment": return "📤";
      case "outbound_date_change": return "📅";
      case "outbound_confirmed": return "✅";
      case "outbound_canceled": return "❌";
      case "work_order_assignment": return "📋";
      case "work_order_unassignment": return "🚫";
      case "work_order_comment": return "💬";
      case "work_order_update": return "✏️";
      case "work_order_status": return "🔄";
      case "work_order_deadline": return "⏰";
      case "work_order_progress": return "📊";
      case "work_order_completed": return "✅";
      case "work_order_file": return "📎";
      default: return "🔔";
    }
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "document_expiry": return "bg-red-50 border-red-200";
      case "estimate_completed": return "bg-sky-50 border-sky-200";
      case "order_completed": return "bg-emerald-50 border-emerald-200";
      case "consultation_followup": return "bg-sky-50 border-sky-200";
      case "todo_reminder": return "bg-amber-50 border-amber-200";
      case "post_comment": return "bg-emerald-50 border-emerald-200";
      case "post_mention": return "bg-violet-50 border-violet-200";
      case "post_reply": return "bg-sky-50 border-sky-200";
      case "inventory_assignment": return "bg-emerald-50 border-emerald-200";
      case "inventory_update": return "bg-sky-50 border-sky-200";
      case "inventory_complete": return "bg-emerald-50 border-emerald-200";
      case "inventory_cancel": return "bg-red-50 border-red-200";
      case "inbound_assignment": return "bg-emerald-50 border-emerald-200";
      case "inbound_date_change": return "bg-amber-50 border-amber-200";
      case "inbound_confirmed": return "bg-emerald-50 border-emerald-200";
      case "inbound_canceled": return "bg-red-50 border-red-200";
      case "outbound_assignment": return "bg-sky-50 border-sky-200";
      case "outbound_date_change": return "bg-amber-50 border-amber-200";
      case "outbound_confirmed": return "bg-emerald-50 border-emerald-200";
      case "outbound_canceled": return "bg-red-50 border-red-200";
      case "work_order_assignment": return "bg-violet-50 border-violet-200";
      case "work_order_unassignment": return "bg-slate-50 border-slate-200";
      case "work_order_comment": return "bg-sky-50 border-sky-200";
      case "work_order_update": return "bg-sky-50 border-sky-200";
      case "work_order_status": return "bg-amber-50 border-amber-200";
      case "work_order_deadline": return "bg-amber-50 border-amber-200";
      case "work_order_progress": return "bg-sky-50 border-sky-200";
      case "work_order_completed": return "bg-emerald-50 border-emerald-200";
      case "work_order_file": return "bg-slate-50 border-slate-200";
      default: return "bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200 cursor-pointer"
        aria-label="알림"
      >
        <Bell className="w-5 h-5 text-slate-500" />

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200/60 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">알림</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-sky-600 hover:text-sky-800 font-medium cursor-pointer transition-colors duration-200"
                >
                  모두 읽음
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-slate-400 text-sm">로딩 중...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellOff className="mx-auto h-10 w-10 text-slate-200 mb-2" />
                  <p className="text-sm text-slate-400">알림이 없습니다</p>
                </div>
              ) : (
                <>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        p-3 border-b border-slate-100/80 cursor-pointer
                        hover:bg-slate-50 transition-colors duration-150
                        ${!notification.read ? "bg-sky-50/40" : ""}
                      `}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`
                            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm border
                            ${getTypeColor(notification.type)}
                          `}
                        >
                          {getTypeIcon(notification.type)}
                        </span>

                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-slate-800 truncate">
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </p>
                        </div>

                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-sky-500 rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* View All Link */}
            {(hasMore || total > 10) && (
              <div className="border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => {
                    router.push("/notifications");
                    setIsOpen(false);
                  }}
                  className="w-full py-3 text-sm text-sky-600 hover:text-sky-800 hover:bg-slate-100 transition-colors duration-200 font-medium cursor-pointer"
                >
                  전체 알림 보기 ({total}개)
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
