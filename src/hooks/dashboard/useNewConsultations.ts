import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

export function useNewConsultations(userId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/tests/consultations/new?userId=${userId}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }), // 🔹 GET 요청 명시
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 60초 동안 중복 요청 방지
    }
  );

  return {
    newConsultations: data?.newConsultations || [],
    newConsultationsIsLoading: isLoading,
    newConsultationsIsError: error,
    refreshNewConsultations: mutate,
  };
}
