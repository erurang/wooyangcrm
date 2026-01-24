import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CompanySalesSummary {
  company_id: string;
  company_name: string;
  completed_estimates: number;
  completed_orders: number;
  total_sales_amount: number;
  total_purchase_amount: number;
  assigned_sales_reps: string[];
}

interface CompanySalesSummaryResponse {
  data: CompanySalesSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseCompanySalesSummaryOptions {
  startDate: string;
  endDate: string;
  search?: string;
  salesRep?: string;
  page?: number;
  limit?: number;
}

export function useCompanySalesSummary(startDate: string, endDate: string) {
  const { data, error, isLoading, mutate } = useSWR<CompanySalesSummary[] | CompanySalesSummaryResponse>(
    startDate && endDate
      ? `/api/companies/sales-summary?start_date=${startDate}&end_date=${endDate}`
      : null,
    fetcher
  );

  // 기존 API 응답 형태와 새 API 응답 형태 모두 지원
  const isNewFormat = data && typeof data === "object" && "data" in data;

  return {
    companySalesSummary: isNewFormat ? (data as CompanySalesSummaryResponse).data : data,
    total: isNewFormat ? (data as CompanySalesSummaryResponse).total : Array.isArray(data) ? data.length : 0,
    totalPages: isNewFormat ? (data as CompanySalesSummaryResponse).totalPages : 1,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

/**
 * 서버 측 필터링 및 페이지네이션을 지원하는 hook
 */
export function useCompanySalesSummaryWithFilters({
  startDate,
  endDate,
  search = "",
  salesRep = "",
  page = 1,
  limit = 20,
}: UseCompanySalesSummaryOptions) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });

  if (search) params.set("search", search);
  if (salesRep) params.set("salesRep", salesRep);
  if (page > 1) params.set("page", String(page));
  if (limit > 0) params.set("limit", String(limit));

  const { data, error, isLoading, mutate } = useSWR<CompanySalesSummaryResponse>(
    startDate && endDate
      ? `/api/companies/sales-summary?${params.toString()}`
      : null,
    fetcher
  );

  return {
    companySalesSummary: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || limit,
    totalPages: data?.totalPages || 1,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
