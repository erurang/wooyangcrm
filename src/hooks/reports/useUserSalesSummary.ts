import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUserSalesSummary(
  userIds: string[],
  startDate?: string,
  endDate?: string
) {
  const { data, error, isLoading } = useSWR(
    userIds.length
      ? `/api/tests/users/salesSummary?${userIds
          .map((id) => `userIds[]=${id}`)
          .join("&")}` +
          (startDate ? `&startDate=${startDate}` : "") +
          (endDate ? `&endDate=${endDate}` : "")
      : null,
    fetcher
  );

  return {
    salesSummary: data,
    isLoading,
    error,
  };
}
