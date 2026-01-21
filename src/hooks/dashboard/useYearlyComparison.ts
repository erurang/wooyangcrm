"use client";

import useSWR from "swr";

interface YearlyData {
  year: number;
  sales: number[];
  purchases: number[];
}

interface YearlyComparisonData {
  months: string[];
  currentYear: YearlyData;
  previousYear: YearlyData;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  // 에러 응답인 경우 throw
  if (data.error) throw new Error(data.error);
  return data;
};

export function useYearlyComparison(userId: string | undefined, year?: number) {
  const currentYear = year || new Date().getFullYear();
  const key = userId ? `/api/dashboard/yearly-comparison?userId=${userId}&year=${currentYear}` : null;

  const { data, error, isLoading } = useSWR<YearlyComparisonData>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1분간 캐시 유지
  });

  return { data: data || null, isLoading, error };
}
