import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { OverseasOrder, OrderType } from "@/types/overseas";

interface UseOverseasOrdersParams {
  companyId?: string;
  orderType?: OrderType;
  page?: number;
  limit?: number;
  invoiceNo?: string;
}

interface UseOverseasOrdersResponse {
  orders: OverseasOrder[];
  total: number;
}

export function useOverseasOrders({
  companyId,
  orderType,
  page = 1,
  limit = 20,
  invoiceNo = "",
}: UseOverseasOrdersParams = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (companyId) {
    params.append("companyId", companyId);
  }

  if (orderType) {
    params.append("orderType", orderType);
  }

  if (invoiceNo) {
    params.append("invoiceNo", invoiceNo);
  }

  const { data, error, isLoading, mutate } = useSWR<UseOverseasOrdersResponse>(
    `/api/overseas-orders?${params.toString()}`,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      keepPreviousData: false,
      dedupingInterval: 0,
    }
  );

  return {
    orders: data?.orders || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}
