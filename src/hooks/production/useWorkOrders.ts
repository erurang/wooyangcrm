import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";
import type { WorkOrder, WorkOrderFilter, WorkOrderCreateRequest } from "@/types/production";

export function useWorkOrders(filters?: WorkOrderFilter) {
  // 필터를 쿼리스트링으로 변환
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.requester_id) params.set("requester_id", filters.requester_id);
  if (filters?.assignee_id) params.set("assignee_id", filters.assignee_id);
  if (filters?.search) params.set("search", filters.search);

  const queryString = params.toString();
  const url = `/api/production/work-orders${queryString ? `?${queryString}` : ""}`;

  const { data, error, isValidating, mutate } = useSWR<{ workOrders: WorkOrder[] }>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const createWorkOrder = async (workOrder: WorkOrderCreateRequest) => {
    const res = await fetch("/api/production/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(workOrder),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "작업지시 생성 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  return {
    workOrders: data?.workOrders || [],
    isLoading: !data && !error,
    isValidating,
    isError: !!error,
    error,
    refresh: mutate,
    createWorkOrder,
  };
}

// 내 작업지시 목록 (담당자로 할당된 것)
export function useMyWorkOrders(userId: string | undefined) {
  const url = userId ? `/api/production/work-orders?assignee_id=${userId}` : null;

  const { data, error, isValidating, mutate } = useSWR<{ workOrders: WorkOrder[] }>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    workOrders: data?.workOrders || [],
    isLoading: !data && !error && !!userId,
    isValidating,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
