import useSWR from "swr";
import { supabase } from "@/lib/supabaseClient";
import type { MonthlyStat, DateFilterType } from "@/types/reports";

interface DocumentData {
  type: string;
  date: string;
  total_amount: number;
}

export function useReportStatistics(
  year: number,
  dateFilter: DateFilterType,
  quarter?: number,
  month?: number
) {
  const fetchStatistics = async (): Promise<{
    monthlyStats: MonthlyStat[];
    previousYearStats: MonthlyStat[];
  }> => {
    // 현재 연도 데이터
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: currentYearData, error: currentError } = await supabase
      .from("documents")
      .select("type, date, total_amount")
      .eq("status", "completed")
      .gte("date", startDate)
      .lte("date", endDate);

    if (currentError) {
      console.error("Error fetching current year stats:", currentError);
      throw currentError;
    }

    // 전년도 데이터
    const prevStartDate = `${year - 1}-01-01`;
    const prevEndDate = `${year - 1}-12-31`;

    const { data: prevYearData, error: prevError } = await supabase
      .from("documents")
      .select("type, date, total_amount")
      .eq("status", "completed")
      .gte("date", prevStartDate)
      .lte("date", prevEndDate);

    if (prevError) {
      console.error("Error fetching previous year stats:", prevError);
      throw prevError;
    }

    // 월별 통계 계산
    const monthlyStats = calculateMonthlyStats(currentYearData || []);
    const previousYearStats = calculateMonthlyStats(prevYearData || []);

    return { monthlyStats, previousYearStats };
  };

  const { data, error, isLoading } = useSWR(
    `report-statistics-${year}-${dateFilter}-${quarter}-${month}`,
    fetchStatistics,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  return {
    monthlyStats: data?.monthlyStats || getEmptyMonthlyStats(),
    previousYearStats: data?.previousYearStats || getEmptyMonthlyStats(),
    isLoading,
    error,
  };
}

function calculateMonthlyStats(documents: DocumentData[]): MonthlyStat[] {
  const stats: Record<
    number,
    { sales: number; purchases: number; salesCount: number; purchaseCount: number }
  > = {};

  // 1~12월 초기화
  for (let m = 1; m <= 12; m++) {
    stats[m] = { sales: 0, purchases: 0, salesCount: 0, purchaseCount: 0 };
  }

  // 데이터 집계
  documents.forEach((doc) => {
    if (!doc.date) return;
    const month = new Date(doc.date).getMonth() + 1;
    const amount = Number(doc.total_amount) || 0;

    if (doc.type === "estimate") {
      stats[month].sales += amount;
      stats[month].salesCount += 1;
    } else if (doc.type === "order") {
      stats[month].purchases += amount;
      stats[month].purchaseCount += 1;
    }
  });

  return Object.entries(stats).map(([month, data]) => ({
    month: Number(month),
    ...data,
  }));
}

function getEmptyMonthlyStats(): MonthlyStat[] {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    sales: 0,
    purchases: 0,
    salesCount: 0,
    purchaseCount: 0,
  }));
}
