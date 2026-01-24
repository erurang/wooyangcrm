import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface RnDs {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  gov_contribution: string;
  pri_contribution: string;
  total_cost: string;
  notes: string;
  support_org: string;
  rnd_orgs?: {
    name: string;
  };
}

interface RnDsListResponse {
  data: RnDs[];
  total: number;
}

export function useRnDsList(page: number, limit: number, searchTerm: string) {
  const { data, error, isLoading, mutate } = useSWR<RnDsListResponse>(
    `/api/manage/rnds?page=${page}&limit=${limit}&name=${searchTerm}`,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    rnds: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    refreshRnds: mutate,
  };
}
