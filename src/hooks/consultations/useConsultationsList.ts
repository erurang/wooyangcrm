import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useConsultationsList(
  companyId: string | undefined,
  currentPage: number,
  searchTerm: string,
  highlightId?: string | null
) {
  const params = new URLSearchParams({
    companyId: companyId || "",
    page: currentPage.toString(),
    search: searchTerm,
  });
  if (highlightId) {
    params.set("highlightId", highlightId);
  }

  const { data, error, mutate, isLoading, isValidating } = useSWR(
    companyId ? `/api/consultations/list?${params.toString()}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      keepPreviousData: true, // 재검증 중 이전 데이터 유지
    }
  );

  return {
    consultations: data?.consultations || [],
    totalPages: data?.totalPages || 1,
    actualPage: data?.currentPage || currentPage,
    // SWR 2.x의 isLoading 사용 (초기 로딩)
    // isValidating은 재검증 중일 때 true
    isLoading: isLoading || (!data && isValidating),
    isValidating,
    isError: !!error,
    refreshConsultations: mutate,
  };
}
