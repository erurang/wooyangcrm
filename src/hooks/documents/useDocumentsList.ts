import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

interface DocumentsResponse {
  documents: unknown[];
}

export function useDocuments(consultationId: string, type: string) {
  const { data, error, mutate } = useSWR<DocumentsResponse>(
    consultationId && type
      ? `/api/documents/type?consultationId=${consultationId}&type=${type}`
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
