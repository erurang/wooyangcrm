import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCompanySalesSummary(startDate: string, endDate: string) {
  const { data, error, isLoading, mutate } = useSWR(
    startDate && endDate
      ? `/api/companies/sales-summary?start_date=${startDate}&end_date=${endDate}`
      : null,
    fetcher
  );

  return {
    companySalesSummary: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
