import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useRnDsDetails(rndsId: string | undefined) {
  const { data, error, mutate, isLoading } = useSWR(
    rndsId ? `/api/manage/rnds/details?rndsId=${rndsId}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    rndsDetail: data || null,
    rnDsDetailLoading: isLoading,
    isError: !!error,
    refreshRnds: mutate,
  };
}
