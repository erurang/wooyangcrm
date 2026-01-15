import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUserSalesSummary(
  userId: string,
  filter: "year" | "quarter" | "month"
) {
  const { data, error } = useSWR(
    userId ? `/api/users/${userId}?filter=${filter}` : null,
    fetcher
  );

  return {
    salesSummary: data || {
      estimates: { pending: 0, completed: 0, canceled: 0, total: 0 },
      orders: { pending: 0, completed: 0, canceled: 0, total: 0 },
    },
    isLoading: !error && !data,
    isError: error,
  };
}
