import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";
import type { WorkOrder, WorkOrderLog } from "@/types/production";

export function useWorkOrder(id: string | undefined) {
  const url = id ? `/api/production/work-orders/${id}` : null;

  const { data, error, isValidating, mutate } = useSWR<{ workOrder: WorkOrder }>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  // 작업지시 수정
  const updateWorkOrder = async (updates: Partial<WorkOrder> & { updated_by?: string }) => {
    if (!id) throw new Error("작업지시 ID가 필요합니다");

    const res = await fetch(`/api/production/work-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "작업지시 수정 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  // 작업지시 삭제
  const deleteWorkOrder = async () => {
    if (!id) throw new Error("작업지시 ID가 필요합니다");

    const res = await fetch(`/api/production/work-orders/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "작업지시 삭제 실패");
    }

    return await res.json();
  };

  // 담당자 추가
  const addAssignee = async (userId: string, assignedBy?: string) => {
    if (!id) throw new Error("작업지시 ID가 필요합니다");

    const res = await fetch(`/api/production/work-orders/${id}/assignees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_ids: [userId], assigned_by: assignedBy }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "담당자 추가 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  // 담당자 제거
  const removeAssignee = async (userId: string) => {
    if (!id) throw new Error("작업지시 ID가 필요합니다");

    const res = await fetch(`/api/production/work-orders/${id}/assignees?user_id=${userId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "담당자 제거 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  // 담당자 완료 처리
  const completeAssignee = async (userId: string) => {
    if (!id) throw new Error("작업지시 ID가 필요합니다");

    const res = await fetch(`/api/production/work-orders/${id}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "완료 처리 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  // 작업지시 취소
  const cancelWorkOrder = async (canceledBy: string, cancelReason?: string) => {
    if (!id) throw new Error("작업지시 ID가 필요합니다");

    const res = await fetch(`/api/production/work-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "canceled",
        canceled_by: canceledBy,
        cancel_reason: cancelReason,
        updated_by: canceledBy,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "작업지시 취소 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  return {
    workOrder: data?.workOrder,
    isLoading: !data && !error && !!id,
    isValidating,
    isError: !!error,
    error,
    refresh: mutate,
    updateWorkOrder,
    deleteWorkOrder,
    addAssignee,
    removeAssignee,
    completeAssignee,
    cancelWorkOrder,
  };
}

// 활동 로그 조회
export function useWorkOrderLogs(workOrderId: string | undefined) {
  const url = workOrderId ? `/api/production/work-orders/${workOrderId}/logs` : null;

  const { data, error, isValidating, mutate } = useSWR<{ logs: WorkOrderLog[] }>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    logs: data?.logs || [],
    isLoading: !data && !error && !!workOrderId,
    isValidating,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
