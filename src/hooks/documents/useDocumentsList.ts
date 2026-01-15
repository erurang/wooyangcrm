import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

export function useDocuments(consultationId: string, type: string) {
  const { data, error, mutate } = useSWR(
    consultationId && type
      ? `/api/documents/type/list?consultationId=${consultationId}&type=${type}`
      : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return {
    documents: data?.documents || [],
    isLoading: !data && !error,
    isError: !!error,
    refreshDocuments: mutate,
  };
}
