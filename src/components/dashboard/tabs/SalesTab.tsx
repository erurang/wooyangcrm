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

interface SalesTabProps {
  salesChart: ChartData;
  itemsChartData: {
    salesData: ChartDataItem[];
  };
  aggregatedSalesCompanies: AggregatedCompany[];
  dateFilter: DateFilterType;
  selectedYear: number;
  selectedQuarter: number;
  selectedMonth: number;
}

export default function SalesTab({
  salesChart,
  itemsChartData,
  aggregatedSalesCompanies,
  dateFilter,
  selectedYear,
  selectedQuarter,
  selectedMonth,
}: SalesTabProps) {
  return (
    <TransactionTab
      type="sales"
      chartData={salesChart}
      itemsData={itemsChartData.salesData}
      companies={aggregatedSalesCompanies}
      dateFilter={dateFilter}
      selectedYear={selectedYear}
      selectedQuarter={selectedQuarter}
      selectedMonth={selectedMonth}
    />
  );
}
