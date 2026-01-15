import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUserTransactions(
  userId: string,
  startDate: string,
  endDate: string
) {
  const { data, error } = useSWR(
    userId && startDate && endDate
      ? `/api/users/${userId}/transactions?startDate=${startDate}&endDate=${endDate}`
      : null,
    fetcher
  );

  return {
    salesCompanies: data?.salesCompanies || [],
    purchaseCompanies: data?.purchaseCompanies || [],
    salesProducts: data?.salesProducts || [],
    purchaseProducts: data?.purchaseProducts || [],
    isLoading: !error && !data,
    isError: error,
  };
}
