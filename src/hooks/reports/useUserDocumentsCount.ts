import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useUserDocumentsCount(
  userIds: string[],
  startDate: string,
  endDate: string
) {
  const { data, error } = useSWR(
    userIds.length > 0
      ? `/api/users/documentsCount?userIds=${userIds.join(
          ","
        )}&startDate=${startDate}&endDate=${endDate}`
      : null,
    fetcher
  );

  return {
    documents: data?.documents || {}, // 빈 객체 기본값 설정
    isLoading: !error && !data,
    isError: error,
  };
}
