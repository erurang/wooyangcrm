import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useRnDsList(page: number, limit: number, searchTerm: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/manage/rnds/list?page=${page}&limit=${limit}&name=${searchTerm}`,
    (url) => fetcher(url, { arg: { method: "GET" } }), // 🔹 GET 요청 명시
    {
      revalidateOnFocus: false,
    }
  );

  return {
    rnds: data?.data,
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    refreshRnds: mutate,
  };
}
