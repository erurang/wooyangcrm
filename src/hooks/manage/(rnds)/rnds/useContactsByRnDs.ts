import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useContactsByRnDs(rndsId: string[]) {
  const rndsIdstring = rndsId.length ? `?rndsId=${rndsId.join(",")}` : null;

  const { data, error, isLoading, mutate } = useSWR(
    rndsIdstring ? `/api/manage/rndContacts/list${rndsIdstring}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }), // 🔹 GET 요청 명시,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    contacts: data?.contacts || [],
    isLoading,
    isError: !!error,
    refreshContacts: mutate,
  };
}
