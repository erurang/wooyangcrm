import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface CompanyDetail {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  parcel?: string;
  notes?: string;
  business_number?: string;
  industry?: string[];
  is_overseas?: boolean;
  website?: string;
}

export function useCompanyDetails(companyId: string | undefined) {
  const { data, error, mutate } = useSWR<CompanyDetail>(
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
