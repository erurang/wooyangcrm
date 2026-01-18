"use client";

import useSWR from "swr";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "urgent" | "high" | "normal" | "low";
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  is_read?: boolean;
}

interface AnnouncementsResponse {
  announcements: Announcement[];
}

const fetcher = async (url: string): Promise<Announcement[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("공지사항 조회 실패");
  }
  const data: AnnouncementsResponse = await response.json();
  return data.announcements;
};

export function useAnnouncements(userId: string | undefined, activeOnly: boolean = true) {
  const { data, error, isLoading, mutate } = useSWR<Announcement[]>(
    userId ? `/api/announcements?userId=${userId}&activeOnly=${activeOnly}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  // 아직 읽지 않은 공지사항
  const unreadAnnouncements = data?.filter((a) => !a.is_read) || [];

  // 읽음 처리
  const markAsRead = async (announcementId: string) => {
    if (!userId) return;
    try {
      await fetch(`/api/announcements/${announcementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      mutate();
    } catch (error) {
      console.error("공지사항 읽음 처리 실패:", error);
    }
  };

  // 모든 공지사항 읽음 처리
  const markAllAsRead = async () => {
    for (const announcement of unreadAnnouncements) {
      await markAsRead(announcement.id);
    }
  };

  return {
    announcements: data || [],
    unreadAnnouncements,
    unreadCount: unreadAnnouncements.length,
    isLoading,
    isError: !!error,
    markAsRead,
    markAllAsRead,
    refresh: mutate,
  };
}

// 관리자용: 모든 공지사항 조회 (비활성 포함)
export function useAllAnnouncements() {
  const { data, error, isLoading, mutate } = useSWR<Announcement[]>(
    `/api/announcements?activeOnly=false`,
    fetcher
  );

  const createAnnouncement = async (announcement: Partial<Announcement>) => {
    const response = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(announcement),
    });
    if (response.ok) {
      mutate();
    }
    return response;
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    const response = await fetch(`/api/announcements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (response.ok) {
      mutate();
    }
    return response;
  };

  const deleteAnnouncement = async (id: string) => {
    const response = await fetch(`/api/announcements/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      mutate();
    }
    return response;
  };

  return {
    announcements: data || [],
    isLoading,
    isError: !!error,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    refresh: mutate,
  };
}
