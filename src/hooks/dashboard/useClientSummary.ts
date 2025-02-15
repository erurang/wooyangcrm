import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

// 📌 고객 요약 정보 가져오기 훅
export function useClientSummary(userId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/tests/clients/summary?userId=${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 60초 동안 동일 요청 중복 방지
    }
  );

  return {
    followUpClients: data?.followUpClients || [],
    clients: data?.clients || [],
    clientsIsLoading: isLoading,
    clientsIsError: error,
    refreshClients: mutate,
  };
}
