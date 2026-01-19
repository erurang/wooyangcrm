"use client";

import useSWR from "swr";

export interface Notification {
  id: number;
  user_id: string;
  type:
    // 문서 관련
    | "document_expiry"
    | "estimate_completed"
    | "order_completed"
    // 상담 관련
    | "consultation_followup"
    // 할일 관련
    | "todo_reminder"
    // 시스템
    | "system"
    // 게시판 관련
    | "post_comment"
    | "post_mention"
    | "post_reply"
    // 재고 입출고 관련 (기존)
    | "inventory_assignment"
    | "inventory_update"
    | "inventory_complete"
    | "inventory_cancel"
    // 입고 관련
    | "inbound_assignment"
    | "inbound_date_change"
    | "inbound_confirmed"
    | "inbound_canceled"
    // 출고 관련
    | "outbound_assignment"
    | "outbound_date_change"
    | "outbound_confirmed"
    | "outbound_canceled"
    // 작업지시 관련
    | "work_order_assignment"
    | "work_order_unassignment"
    | "work_order_comment"
    | "work_order_update"
    | "work_order_status"
    | "work_order_deadline"
    | "work_order_progress"
    | "work_order_completed"
    | "work_order_file";
  title: string;
  message: string;
  related_id: string | null;
  related_type: "document" | "consultation" | "todo" | "post" | "inventory_task" | "work_order" | "inbound" | "outbound" | null;
  read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  notifications: Notification[];
}

const fetcher = async (url: string): Promise<Notification[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("알림 조회 실패");
  }
  const data: NotificationsResponse = await response.json();
  return data.notifications;
};

export function useNotifications(userId: string | undefined) {
  console.log("useNotifications called with userId:", userId);

  const { data, error, isLoading, mutate } = useSWR<Notification[]>(
    userId ? `/api/notifications?userId=${userId}` : null,
    fetcher,
    {
      refreshInterval: 30000, // 30초마다 자동 새로고침
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  console.log("useNotifications data:", { data, error, isLoading });

  const unreadCount = data?.filter((n) => !n.read).length || 0;

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });
      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/notifications?userId=${userId}`, {
        method: "PATCH",
      });
      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error("전체 알림 읽음 처리 실패:", error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        mutate();
      }
    } catch (error) {
      console.error("알림 삭제 실패:", error);
    }
  };

  return {
    notifications: data || [],
    unreadCount,
    isLoading,
    isError: !!error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: mutate,
  };
}
