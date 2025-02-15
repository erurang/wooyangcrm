import useSWR from "swr";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch data");
  return response.json();
};

// 📌 대시보드 데이터 가져오기 훅
export function useDashboardData(userId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/dashboard?userId=${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false, // 포커스 시 자동 갱신 여부 (필요하면 true)
      dedupingInterval: 60000, // 60초 동안 동일한 요청 중복 방지
    }
  );

  return {
    dashboardData: data,
    isLoading,
    isError: error,
    refreshDashboard: mutate, // 데이터 갱신 함수
  };
}
