import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { CustomsCost, ShippingMethodType } from "@/types/overseas";

interface UseCustomsCostsParams {
  page?: number;
  limit?: number;
  companyId?: string;
  shippingMethod?: ShippingMethodType | "";
  forwarder?: string;
  startDate?: string;
  endDate?: string;
}

interface UseCustomsCostsResponse {
  customsCosts: CustomsCost[];
  total: number;
}

export function useCustomsCosts({
  page = 1,
  limit = 20,
  companyId = "",
  shippingMethod = "",
  forwarder = "",
  startDate = "",
  endDate = "",
}: UseCustomsCostsParams = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (companyId) params.append("company_id", companyId);
  if (shippingMethod) params.append("shipping_method", shippingMethod);
  if (forwarder) params.append("forwarder", forwarder);
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);

  const { data, error, isLoading, mutate } = useSWR<UseCustomsCostsResponse>(
    `/api/customs-costs?${params.toString()}`,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    customsCosts: data?.customsCosts || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}
