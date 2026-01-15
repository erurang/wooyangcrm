import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useCompanyDetails(companyId: string | undefined) {
  const { data, error, mutate } = useSWR(
    companyId ? `/api/companies/details?companyId=${companyId}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    companyDetail: data || null,
    isLoading: !data && !error,
    isError: !!error,
    refreshCompany: mutate,
  };
}
