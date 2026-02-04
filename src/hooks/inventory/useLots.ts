import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import type {
  InventoryLotWithDetails,
  LotListResponse,
  LotFilters,
  CreateLotRequest,
  UpdateLotRequest,
  SplitLotRequest,
  SplitLotResponse,
} from "@/types/inventory";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * LOT 목록 조회 훅
 */
export function useLots(filters: LotFilters = {}) {
  const params = new URLSearchParams();

  if (filters.product_id) params.set("product_id", filters.product_id);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.source_type) params.set("source_type", filters.source_type);
  if (filters.supplier_company_id) params.set("supplier_company_id", filters.supplier_company_id);
  if (filters.location) params.set("location", filters.location);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", filters.page.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());

  const queryString = params.toString();
  const url = `/api/inventory/lots${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<LotListResponse>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });

  return {
    lots: data?.lots || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}

/**
 * 단일 LOT 조회 훅
 */
export function useLot(lotId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ lot: InventoryLotWithDetails }>(
    lotId ? `/api/inventory/lots/${lotId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    lot: data?.lot,
    isLoading,
    isError: !!error,
    mutate,
  };
}

/**
 * LOT 트랜잭션 조회 훅
 */
export function useLotTransactions(lotId: string | null) {
  const { data, error, isLoading } = useSWR(
    lotId ? `/api/inventory/lots/${lotId}/transactions` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    transactions: data?.transactions || [],
    isLoading,
    isError: !!error,
  };
}

/**
 * LOT 분할 이력 조회 훅
 */
export function useLotSplitHistory(lotId: string | null) {
  const { data, error, isLoading } = useSWR(
    lotId ? `/api/inventory/lots/${lotId}/split` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    splitFrom: data?.split_from || [],
    splitTo: data?.split_to || [],
    isLoading,
    isError: !!error,
  };
}

// Mutation fetcher
async function mutationFetcher<T>(
  url: string,
  { arg }: { arg: { method: string; body?: unknown } }
): Promise<T> {
  const res = await fetch(url, {
    method: arg.method,
    headers: { "Content-Type": "application/json" },
    body: arg.body ? JSON.stringify(arg.body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "요청 처리 중 오류가 발생했습니다.");
  }

  return data;
}

/**
 * LOT CRUD 뮤테이션 훅
 */
export function useLotMutations() {
  // 생성
  const { trigger: triggerCreate, isMutating: isCreating } = useSWRMutation(
    "/api/inventory/lots",
    mutationFetcher<{ success: boolean; lot: InventoryLotWithDetails; message: string }>
  );

  // 수정
  const { trigger: triggerUpdate, isMutating: isUpdating } = useSWRMutation(
    "/api/inventory/lots",
    async (
      _key: string,
      { arg }: { arg: { lotId: string; data: UpdateLotRequest & { user_id?: string } } }
    ) => {
      const res = await fetch(`/api/inventory/lots/${arg.lotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg.data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json;
    }
  );

  // 삭제 (폐기)
  const { trigger: triggerDelete, isMutating: isDeleting } = useSWRMutation(
    "/api/inventory/lots",
    async (_key: string, { arg }: { arg: { lotId: string; user_id?: string } }) => {
      const params = arg.user_id ? `?user_id=${arg.user_id}` : "";
      const res = await fetch(`/api/inventory/lots/${arg.lotId}${params}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json;
    }
  );

  // 분할
  const { trigger: triggerSplit, isMutating: isSplitting } = useSWRMutation(
    "/api/inventory/lots",
    async (
      _key: string,
      { arg }: { arg: { lotId: string; data: SplitLotRequest & { user_id?: string } } }
    ): Promise<SplitLotResponse & { message: string }> => {
      const res = await fetch(`/api/inventory/lots/${arg.lotId}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg.data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json;
    }
  );

  const createLot = async (data: CreateLotRequest & { user_id?: string }) => {
    try {
      const result = await triggerCreate({ method: "POST", body: data });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const updateLot = async (lotId: string, data: UpdateLotRequest & { user_id?: string }) => {
    try {
      const result = await triggerUpdate({ lotId, data });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const deleteLot = async (lotId: string, user_id?: string) => {
    try {
      const result = await triggerDelete({ lotId, user_id });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  const splitLot = async (lotId: string, data: SplitLotRequest & { user_id?: string }) => {
    try {
      const result = await triggerSplit({ lotId, data });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  return {
    createLot,
    updateLot,
    deleteLot,
    splitLot,
    isCreating,
    isUpdating,
    isDeleting,
    isSplitting,
    isLoading: isCreating || isUpdating || isDeleting || isSplitting,
  };
}
