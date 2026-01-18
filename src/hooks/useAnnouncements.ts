"use client";

import useSWR from "swr";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "urgent" | "high" | "normal" | "low";
  is_active: boolean;
  is_pinned?: boolean;
  category?: string;
  view_count?: number;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  author_name?: string;
  created_at: string;
  updated_at?: string;
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

interface UseAllAnnouncementsOptions {
  search?: string;
  authorId?: string;
}

// 관리자용: 모든 공지사항 조회 (비활성 포함, 검색/필터 지원)
export function useAllAnnouncements(options?: UseAllAnnouncementsOptions) {
  const { search, authorId } = options || {};

  const buildUrl = () => {
    const params = new URLSearchParams({ activeOnly: "false" });
    if (search) params.set("search", search);
    if (authorId) params.set("authorId", authorId);
    return `/api/announcements?${params.toString()}`;
  };

  const { data, error, isLoading, mutate } = useSWR<Announcement[]>(
    buildUrl(),
    fetcher
  );

  const createAnnouncement = async (announcement: Partial<Announcement>) => {
    const response = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(announcement),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "공지사항 생성에 실패했습니다");
    }
    await mutate();
    return response;
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    const response = await fetch(`/api/announcements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "공지사항 수정에 실패했습니다");
    }
    await mutate();
    return response;
  };

  const deleteAnnouncement = async (id: string) => {
    const response = await fetch(`/api/announcements/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "공지사항 삭제에 실패했습니다");
    }
    await mutate();
    return response;
  };

  const togglePin = async (id: string, isPinned: boolean) => {
    return updateAnnouncement(id, { is_pinned: !isPinned });
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    return updateAnnouncement(id, { is_active: !isActive });
  };

  return {
    announcements: data || [],
    isLoading,
    isError: !!error,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePin,
    toggleActive,
    refresh: mutate,
  };
}
