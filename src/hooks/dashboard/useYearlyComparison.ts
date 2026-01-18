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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
