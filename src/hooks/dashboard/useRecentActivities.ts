import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useRecentActivities(userId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/tests/dashboard/recent-activities?userId=${userId}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }), // 🔹 GET 요청 명시
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분 동안 동일한 요청 방지
    }
  );

  return {
    recentActivities: data,
    recentActivitiesIsLoading: isLoading,
    recentActivitiesIsError: error,
    refreshRecentActivities: mutate, // 데이터 갱신 함수
  };
}
