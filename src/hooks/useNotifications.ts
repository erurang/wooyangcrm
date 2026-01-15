"use client";

import useSWR from "swr";

export interface Notification {
  id: number;
  user_id: string;
  type: "document_expiry" | "consultation_followup" | "todo_reminder" | "system";
  title: string;
  message: string;
  related_id: string | null;
  related_type: "document" | "consultation" | "todo" | null;
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
  const { data, error, isLoading, mutate } = useSWR<Notification[]>(
    userId ? `/api/notifications?userId=${userId}` : null,
    fetcher,
    {
      refreshInterval: 60000, // 1분마다 자동 새로고침
      revalidateOnFocus: true,
    }
  );

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
