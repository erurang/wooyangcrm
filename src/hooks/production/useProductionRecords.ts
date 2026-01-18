import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";
import type {
  ProductionRecord,
  ProductionRecordFilter,
  ProductionRecordCreateRequest,
} from "@/types/production";

export function useProductionRecords(filters?: ProductionRecordFilter) {
  // 필터를 쿼리스트링으로 변환
  const params = new URLSearchParams();
  if (filters?.product_id) params.set("product_id", filters.product_id);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.date_from) params.set("date_from", filters.date_from);
  if (filters?.date_to) params.set("date_to", filters.date_to);
  if (filters?.search) params.set("search", filters.search);

  const queryString = params.toString();
  const url = `/api/production/records${queryString ? `?${queryString}` : ""}`;

  const { data, error, isValidating, mutate } = useSWR<{ records: ProductionRecord[] }>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  // 생산 기록 생성
  const createRecord = async (record: ProductionRecordCreateRequest) => {
    const res = await fetch("/api/production/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "생산 기록 등록 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  // 생산 기록 취소
  const cancelRecord = async (recordId: string, canceledBy?: string, cancelReason?: string) => {
    const params = new URLSearchParams();
    if (canceledBy) params.set("canceled_by", canceledBy);
    if (cancelReason) params.set("cancel_reason", cancelReason);

    const res = await fetch(`/api/production/records/${recordId}?${params.toString()}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "생산 기록 취소 실패");
    }

    const result = await res.json();
    await mutate();
    return result;
  };

  return {
    records: data?.records || [],
    isLoading: !data && !error,
    isValidating,
    isError: !!error,
    error,
    refresh: mutate,
    createRecord,
    cancelRecord,
  };
}

// 개별 생산 기록 상세 조회
export function useProductionRecord(id: string | undefined) {
  const url = id ? `/api/production/records/${id}` : null;

  const { data, error, isValidating, mutate } = useSWR<{ record: ProductionRecord }>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    record: data?.record,
    isLoading: !data && !error && !!id,
    isValidating,
    isError: !!error,
    error,
    refresh: mutate,
  };
}
