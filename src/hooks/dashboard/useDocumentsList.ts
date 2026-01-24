import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

interface DocumentsListResponse {
  documents: unknown[];
}

// 📌 대시보드 데이터 가져오기 훅
export function useDocumentsList(userId: string) {
  const { data, error, isLoading, mutate } = useSWR<DocumentsListResponse>(
    userId ? `/api/documents/list?userId=${userId}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    documents: data?.documents || [],
    documentsIsLoading: isLoading,
    documentsIsError: error,
    refreshDocuments: mutate, // 데이터 갱신 함수
  };
}
