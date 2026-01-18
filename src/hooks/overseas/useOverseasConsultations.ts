import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface OverseasConsultation {
  id: string;
  company_id: string;
  company_name: string;
  contact_id?: string;
  contact_name?: string;
  user_id: string;
  user_name: string;
  date: string;
  content: string;
  status?: string;
  priority?: string;
  shipping_date?: string;
  incoterms?: string;
  lc_number?: string;
  port_of_loading?: string;
  port_of_discharge?: string;
  created_at: string;
}

interface UseOverseasConsultationsParams {
  page?: number;
  limit?: number;
  companyId?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

interface UseOverseasConsultationsResponse {
  consultations: OverseasConsultation[];
  total: number;
}

export function useOverseasConsultations({
  page = 1,
  limit = 20,
  companyId = "",
  keyword = "",
  startDate = "",
  endDate = "",
}: UseOverseasConsultationsParams = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (companyId) params.append("company_id", companyId);
  if (keyword) params.append("keyword", keyword);
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);

  const { data, error, isLoading, mutate } = useSWR<UseOverseasConsultationsResponse>(
    `/api/overseas/consultations?${params.toString()}`,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    consultations: data?.consultations || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}
