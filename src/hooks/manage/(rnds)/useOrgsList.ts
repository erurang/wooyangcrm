import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useOrgsList() {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/manage/orgs/list`,
    (url) => fetcher(url, { arg: { method: "GET" } }), // 🔹 GET 요청 명시
    {
      revalidateOnFocus: false,
    }
  );

  return {
    orgs: data,
    isLoading,
    isError: !!error,
    refreshOrgs: mutate,
  };
}
