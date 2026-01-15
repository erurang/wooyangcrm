"use client";

import { useDashboard } from "@/context/dashboard";
import SalesTab from "@/components/dashboard/tabs/SalesTab";

export default function DashboardSalesPage() {
  const {
    chartData,
    aggregatedData,
    dateFilter,
    selectedYear,
    selectedQuarter,
    selectedMonth,
  } = useDashboard();

  return (
    <SalesTab
      salesChart={chartData.salesChart}
      itemsChartData={chartData.itemsChartData}
      aggregatedSalesCompanies={aggregatedData.salesCompanies}
      dateFilter={dateFilter}
      selectedYear={selectedYear}
      selectedQuarter={selectedQuarter}
      selectedMonth={selectedMonth}
    />
  );
}
