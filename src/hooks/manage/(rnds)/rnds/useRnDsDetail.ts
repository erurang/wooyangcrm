import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface RndDetail {
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
    id: string;
    name: string;
  };
}

export function useRnDsDetails(rndsId: string | undefined) {
  const { data, error, mutate, isLoading } = useSWR<RndDetail | null>(
    rndsId ? `/api/manage/rnds/details?rndsId=${rndsId}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    rndsDetail: data ?? null,
    rnDsDetailLoading: isLoading,
    isError: !!error,
    refreshRnds: async () => {
      await mutate();
    },
  };
}
