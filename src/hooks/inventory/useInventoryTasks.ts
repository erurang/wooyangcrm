import useSWR from "swr";
import type {
  InventoryTaskFilters,
  InventoryTaskListResponse,
  InventoryTaskWithDetails,
} from "@/types/inventory";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch");
  }
  return res.json();
};

export function useInventoryTasks(filters: InventoryTaskFilters = {}) {
  const params = new URLSearchParams();

  if (filters.task_type) params.set("task_type", filters.task_type);
  // overdue는 별도 파라미터로 처리
  if (filters.status === "overdue") {
    params.set("overdue", "true");
  } else if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (filters.company_id) params.set("company_id", filters.company_id);
  if (filters.assigned_to) params.set("assigned_to", filters.assigned_to);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", filters.page.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());

  const queryString = params.toString();
  const url = `/api/inventory/tasks${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<InventoryTaskListResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      keepPreviousData: true, // 새 데이터 로드 중 이전 데이터 유지 (깜빡임 방지)
    }
  );

  return {
    tasks: data?.tasks || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export function useInventoryTask(taskId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{
    task: InventoryTaskWithDetails;
  }>(taskId ? `/api/inventory/tasks/${taskId}` : null, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    task: data?.task || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

interface InventoryStats {
  total: number;
  pending: number;
  assigned: number;
  completed: number;
  canceled: number;
  overdue: number;
}

interface InventoryStatsFilters {
  taskType: "inbound" | "outbound";
  date_from?: string;
  date_to?: string;
}

export function useInventoryStats(filters: InventoryStatsFilters) {
  const params = new URLSearchParams();
  params.set("task_type", filters.taskType);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);

  const url = `/api/inventory/tasks/stats?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<{ stats: InventoryStats }>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      keepPreviousData: true, // 새 데이터 로드 중 이전 데이터 유지 (깜빡임 방지)
    }
  );

  return {
    stats: data?.stats || {
      total: 0,
      pending: 0,
      assigned: 0,
      completed: 0,
      canceled: 0,
      overdue: 0,
    },
    isLoading,
    isError: !!error,
    mutate,
  };
}
