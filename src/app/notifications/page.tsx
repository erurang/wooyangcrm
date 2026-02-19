"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoginUser } from "@/context/login";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { Notification } from "@/hooks/useNotifications";

export default function NotificationsPage() {
  const router = useRouter();
  const loginUser = useLoginUser();
  const userId = loginUser?.id;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const limit = 20;

  // 알림 목록 조회
  const fetchNotifications = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/notifications?userId=${userId}&limit=${limit}&page=${page}`
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("알림 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId, page]);

  // 알림 읽음 처리
  const markAsRead = async (notificationId: number) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  // 전체 읽음 처리
  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error("전체 읽음 처리 실패:", error);
    }
  };

  // 알림 삭제
  const deleteNotification = async (notificationId: number) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setTotal((prev) => prev - 1);
      }
    } catch (error) {
      console.error("알림 삭제 실패:", error);
    }
  };

  // 알림 클릭 핸들러
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
          const isInbound =
            notification.message?.includes("입고") ||
            notification.title?.includes("입고");
          const targetPage = isInbound
            ? "/inventory/inbound"
            : "/inventory/outbound";
          router.push(`${targetPage}?highlight=${notification.related_id}`);
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
  };

  // 알림 타입별 아이콘
  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "document_expiry":
        return "📄";
      case "estimate_completed":
        return "📤";
      case "order_completed":
        return "📥";
      case "consultation_followup":
        return "💬";
      case "todo_reminder":
        return "✅";
      case "post_comment":
        return "💬";
      case "post_mention":
        return "@";
      case "post_reply":
        return "↩️";
      case "inventory_assignment":
        return "📦";
      case "inventory_update":
        return "📝";
      case "inventory_complete":
        return "✅";
      case "inventory_cancel":
        return "❌";
      case "inbound_assignment":
        return "📥";
      case "inbound_date_change":
        return "📅";
      case "inbound_confirmed":
        return "✅";
      case "inbound_canceled":
        return "❌";
      case "outbound_assignment":
        return "📤";
      case "outbound_date_change":
        return "📅";
      case "outbound_confirmed":
        return "✅";
      case "outbound_canceled":
        return "❌";
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
      case "estimate_completed":
        return "bg-sky-50 border-sky-200";
      case "order_completed":
        return "bg-green-50 border-green-200";
      case "consultation_followup":
        return "bg-sky-50 border-sky-200";
      case "todo_reminder":
        return "bg-yellow-50 border-yellow-200";
      case "post_comment":
        return "bg-green-50 border-green-200";
      case "post_mention":
        return "bg-purple-50 border-purple-200";
      case "post_reply":
        return "bg-sky-50 border-sky-200";
      case "inventory_assignment":
        return "bg-green-50 border-green-200";
      case "inventory_update":
        return "bg-sky-50 border-sky-200";
      case "inventory_complete":
        return "bg-emerald-50 border-emerald-200";
      case "inventory_cancel":
        return "bg-red-50 border-red-200";
      case "inbound_assignment":
        return "bg-green-50 border-green-200";
      case "inbound_date_change":
        return "bg-yellow-50 border-yellow-200";
      case "inbound_confirmed":
        return "bg-emerald-50 border-emerald-200";
      case "inbound_canceled":
        return "bg-red-50 border-red-200";
      case "outbound_assignment":
        return "bg-sky-50 border-sky-200";
      case "outbound_date_change":
        return "bg-yellow-50 border-yellow-200";
      case "outbound_confirmed":
        return "bg-emerald-50 border-emerald-200";
      case "outbound_canceled":
        return "bg-red-50 border-red-200";
      case "work_order_assignment":
        return "bg-purple-50 border-purple-200";
      case "work_order_unassignment":
        return "bg-slate-50 border-slate-200";
      case "work_order_comment":
        return "bg-sky-50 border-sky-200";
      case "work_order_update":
        return "bg-sky-50 border-sky-200";
      case "work_order_status":
        return "bg-orange-50 border-orange-200";
      case "work_order_deadline":
        return "bg-yellow-50 border-yellow-200";
      case "work_order_progress":
        return "bg-sky-50 border-sky-200";
      case "work_order_completed":
        return "bg-green-50 border-green-200";
      case "work_order_file":
        return "bg-slate-50 border-slate-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  // 필터링된 알림
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "read") return n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-slate-800">알림</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-sky-600 hover:text-sky-800 font-medium"
            >
              모두 읽음
            </button>
          )}
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 mb-4">
          {(["all", "unread", "read"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-sky-600 text-white"
                  : "bg-white text-slate-500 hover:bg-slate-100"
              }`}
            >
              {f === "all" && "전체"}
              {f === "unread" && "읽지 않음"}
              {f === "read" && "읽음"}
            </button>
          ))}
        </div>

        {/* 알림 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">로딩 중...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <svg
                className="mx-auto h-16 w-16 text-slate-300 mb-4"
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
              <p className="text-lg">알림이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                    !notification.read ? "bg-sky-50/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-4">
                    {/* 타입 아이콘 */}
                    <span
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg border ${getTypeColor(
                        notification.type
                      )}`}
                    >
                      {getTypeIcon(notification.type)}
                    </span>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-medium ${
                            notification.read ? "text-slate-600" : "text-slate-800"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-sky-500 rounded-full mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="px-4 py-2 text-sm text-slate-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}

        {/* 총 개수 */}
        <p className="text-center text-sm text-slate-400 mt-4">
          총 {total}개의 알림
        </p>
      </div>
    </div>
  );
}
