import useSWR from "swr";
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCompanySalesSummaryDetail(
  companyId: string,
  startDate: string,
  endDate: string
) {
  const { data, error, isLoading } = useSWR(
    companyId
      ? `/api/tests/companies/sales-summary/${companyId}?startDate=${startDate}&endDate=${endDate}`
      : null,
    fetcher
  );

  return {
    companySalesSummary: data ? data[0] : {},
    isLoading,
    isError: error,
  };
}
