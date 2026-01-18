import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { OverseasCompany } from "@/types/overseas";

interface UseOverseasCompaniesParams {
  page?: number;
  limit?: number;
  name?: string;
}

interface UseOverseasCompaniesResponse {
  companies: OverseasCompany[];
  total: number;
}

export function useOverseasCompanies({
  page = 1,
  limit = 20,
  name = "",
}: UseOverseasCompaniesParams = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (name) {
    params.append("name", name);
  }

  const { data, error, isLoading, mutate } = useSWR<UseOverseasCompaniesResponse>(
    `/api/companies/overseas?${params.toString()}`,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    companies: data?.companies || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}
