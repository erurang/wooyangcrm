"use client";

import { useDashboard } from "@/context/dashboard";
import TrendsTab from "@/components/dashboard/tabs/TrendsTab";

export default function DashboardTrendsPage() {
  const {
    monthlyTrendData,
    dateFilter,
    selectedYear,
    selectedQuarter,
    selectedMonth,
  } = useDashboard();

  return (
    <TrendsTab
      monthlyTrendData={monthlyTrendData}
      dateFilter={dateFilter}
      selectedYear={selectedYear}
      selectedQuarter={selectedQuarter}
      selectedMonth={selectedMonth}
    />
  );
}
