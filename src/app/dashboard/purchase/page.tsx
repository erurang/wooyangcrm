"use client";

import { useDashboard } from "@/context/dashboard";
import PurchaseTab from "@/components/dashboard/tabs/PurchaseTab";

export default function DashboardPurchasePage() {
  const {
    chartData,
    aggregatedData,
    dateFilter,
    selectedYear,
    selectedQuarter,
    selectedMonth,
  } = useDashboard();

  return (
    <PurchaseTab
      purchaseChart={chartData.purchaseChart}
      itemsChartData={chartData.itemsChartData}
      aggregatedPurchaseCompanies={aggregatedData.purchaseCompanies}
      dateFilter={dateFilter}
      selectedYear={selectedYear}
      selectedQuarter={selectedQuarter}
      selectedMonth={selectedMonth}
    />
  );
}
