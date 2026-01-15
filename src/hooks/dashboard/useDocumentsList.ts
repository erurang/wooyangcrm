import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

// 📌 대시보드 데이터 가져오기 훅
export function useDocumentsList(userId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/documents/list?userId=${userId}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }), // 🔹 GET 요청 명시
    {
      revalidateOnFocus: false, // 포커스 시 자동 갱신 여부 (필요하면 true)
    }
  );

  return {
    documents: data?.documents,
    documentsIsLoading: isLoading,
    documentsIsError: error,
    refreshDocuments: mutate, // 데이터 갱신 함수
  };
}
