import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface Org {
  id: string;
  name: string;
}

export function useOrgsList() {
  const { data, error, isLoading, mutate } = useSWR<Org[]>(
    `/api/manage/orgs`,
    (url) => fetcher(url, { arg: { method: "GET" } }), // 🔹 GET 요청 명시
    {
      revalidateOnFocus: false,
    }
  );

  return {
    orgs: data || [],
    isLoading,
    isError: !!error,
    refreshOrgs: mutate,
  };
}
