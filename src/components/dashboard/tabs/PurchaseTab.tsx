"use client";

import TransactionTab from "./TransactionTab";

interface ChartDataItem {
  name: string;
  value: number;
}

interface ChartData {
  labels: string[];
  data: number[];
}

interface AggregatedCompany {
  name: string;
  total: number;
}

type DateFilterType = "year" | "quarter" | "month";

interface PurchaseTabProps {
  purchaseChart: ChartData;
  itemsChartData: {
    purchaseData: ChartDataItem[];
  };
  aggregatedPurchaseCompanies: AggregatedCompany[];
  dateFilter: DateFilterType;
  selectedYear: number;
  selectedQuarter: number;
  selectedMonth: number;
}

export default function PurchaseTab({
  purchaseChart,
  itemsChartData,
  aggregatedPurchaseCompanies,
  dateFilter,
  selectedYear,
  selectedQuarter,
  selectedMonth,
}: PurchaseTabProps) {
  return (
    <TransactionTab
      type="purchase"
      chartData={purchaseChart}
      itemsData={itemsChartData.purchaseData}
      companies={aggregatedPurchaseCompanies}
      dateFilter={dateFilter}
      selectedYear={selectedYear}
      selectedQuarter={selectedQuarter}
      selectedMonth={selectedMonth}
    />
  );
}
