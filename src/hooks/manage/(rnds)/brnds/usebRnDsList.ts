import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface Brnds {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  gov_contribution: string;
  pri_contribution: string;
  total_cost: string;
  notes: string;
  support_org: string;
}

interface BRnDsListResponse {
  data: Brnds[];
  total: number;
}

export function usebRnDsList(page: number, limit: number, searchTerm: string) {
  const { data, error, isLoading, mutate } = useSWR<BRnDsListResponse>(
    `/api/manage/brnds?page=${page}&limit=${limit}&name=${searchTerm}`,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    brnds: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    refreshRnds: mutate,
  };
}
