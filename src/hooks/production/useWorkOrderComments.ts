import useSWR, { mutate } from "swr";
import type { WorkOrderComment } from "@/types/production";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useWorkOrderComments(workOrderId: string | null) {
  const { data, error, isLoading } = useSWR(
    workOrderId ? `/api/production/work-orders/${workOrderId}/comments` : null,
    fetcher
  );

  const addComment = async (userId: string, content: string) => {
    if (!workOrderId) return { error: "작업지시 ID가 없습니다" };

    const response = await fetch(
      `/api/production/work-orders/${workOrderId}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, content }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      mutate(`/api/production/work-orders/${workOrderId}/comments`);
      mutate(`/api/production/work-orders/${workOrderId}/logs`);
    }

    return result;
  };

  const updateComment = async (commentId: string, userId: string, content: string) => {
    if (!workOrderId) return { error: "작업지시 ID가 없습니다" };

    const response = await fetch(
      `/api/production/work-orders/${workOrderId}/comments`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId, user_id: userId, content }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      mutate(`/api/production/work-orders/${workOrderId}/comments`);
      mutate(`/api/production/work-orders/${workOrderId}/logs`);
    }

    return result;
  };

  const deleteComment = async (commentId: string, userId: string) => {
    if (!workOrderId) return { error: "작업지시 ID가 없습니다" };

    const response = await fetch(
      `/api/production/work-orders/${workOrderId}/comments?comment_id=${commentId}&user_id=${userId}`,
      { method: "DELETE" }
    );

    const result = await response.json();

    if (response.ok) {
      mutate(`/api/production/work-orders/${workOrderId}/comments`);
      mutate(`/api/production/work-orders/${workOrderId}/logs`);
    }

    return result;
  };

  return {
    comments: (data?.comments as WorkOrderComment[]) || [],
    isLoading,
    error,
    addComment,
    updateComment,
    deleteComment,
  };
}
