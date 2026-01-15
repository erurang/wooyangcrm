import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUserDocumentList(
  userId: string,
  startDate: string,
  endDate: string
) {
  const { data, error, isLoading } = useSWR(
    userId && startDate && endDate
      ? `/api/users/${userId}/documents?startDate=${startDate}&endDate=${endDate}`
      : null,
    fetcher
  );

  return {
    documentsDetails: data,
    isLoading,
    error,
  };
}
