import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

interface FollowUpClient {
  id: string;
  company_id: string;
  company_name: string;
  follow_date: string;
  last_consultation?: string;
}

interface Client {
  id: string;
  name: string;
}

interface ClientSummaryResponse {
  followUpClients: FollowUpClient[];
  clients: Client[];
}

// 📌 고객 요약 정보 가져오기 훅
export function useClientSummary(userId: string) {
  const { data, error, isLoading, mutate } = useSWR<ClientSummaryResponse>(
    userId ? `/api/clients/summary?userId=${userId}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
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
