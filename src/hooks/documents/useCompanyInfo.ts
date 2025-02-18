// `/hooks/companies/useCompanyInfo.ts`
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useCompanyInfo(companyId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    companyId ? `/api/tests/companies/${companyId}` : null,
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
