import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { CustomsCostStats } from "@/types/overseas";

interface UseCustomsCostStatsParams {
  year?: string;
  month?: string;
  companyId?: string;
}

interface UseCustomsCostStatsResponse {
  stats: CustomsCostStats;
  monthlyBreakdown: CustomsCostStats[] | null;
}

export function useCustomsCostStats({
  year = new Date().getFullYear().toString(),
  month = "",
  companyId = "",
}: UseCustomsCostStatsParams = {}) {
  const params = new URLSearchParams({ year });

  if (month) params.append("month", month);
  if (companyId) params.append("company_id", companyId);

  const { data, error, isLoading, mutate } = useSWR<UseCustomsCostStatsResponse>(
    `/api/customs-costs/stats?${params.toString()}`,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    stats: data?.stats || null,
    monthlyBreakdown: data?.monthlyBreakdown || null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
