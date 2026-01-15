import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useConsultationsList(
  companyId: string | undefined,
  currentPage: number,
  searchTerm: string
) {
  const { data, error, mutate } = useSWR(
    companyId
      ? `/api/consultations/list?companyId=${companyId}&page=${currentPage}&search=${searchTerm}`
      : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    consultations: data?.consultations || [],
    totalPages: data?.totalPages || 1,
    isLoading: !data && !error,
    isError: !!error,
    refreshConsultations: mutate,
  };
}
