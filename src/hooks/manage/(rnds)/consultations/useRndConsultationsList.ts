import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface Consultation {
  id: string;
  date: string;
  content: string;
  start_date: string;
  end_date: string;
  participation: "참여" | "주관기관" | "공동연구기관";
  user_id: string;
  total_cost: string;
  gov_contribution: string;
  pri_contribution: string;
  org_id: string;
  rnd_id: string;
}

interface ConsultationsResponse {
  consultations: Consultation[];
  totalPages: number;
}

export function useRndConsultationsList(
  rndId: string | undefined,
  currentPage: number,
  searchTerm: string
) {
  const { data, error, mutate } = useSWR<ConsultationsResponse>(
    rndId
      ? `/api/manage/consultations?rndId=${rndId}&page=${currentPage}&search=${searchTerm}`
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
    refreshConsultations: async () => {
      await mutate();
    },
  };
}
