import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useOrgsList(page: number, limit: number, searchTerm: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/tests/manage/orgs/list/page?page=${page}&limit=${limit}&name=${searchTerm}`,
    (url) => fetcher(url, { arg: { method: "GET" } }), // 🔹 GET 요청 명시
    {
      revalidateOnFocus: false,
    }
  );

  return {
    orgs: data?.data,
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    refreshOrgs: mutate,
  };
}
