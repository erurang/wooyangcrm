// `/hooks/companies/useCompanyInfo.ts`
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface CompanyInfo {
  id: string;
  name: string;
  phone?: string;
  fax?: string;
  address?: string;
  business_number?: string;
  email?: string;
  notes?: string;
  parcel?: string;
  industry?: string[];
}

interface CompanyInfoResponse {
  company: CompanyInfo | null;
}

export function useCompanyInfo(companyId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<CompanyInfoResponse>(
    companyId ? `/api/companies/${companyId}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    company: data?.company || null,
    isLoading,
    isError: !!error,
    refreshCompany: mutate, // 데이터 최신화 기능 추가
  };
}
