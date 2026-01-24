"use client";

import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SalesTab
        salesChart={chartData.salesChart}
        itemsChartData={chartData.itemsChartData}
        aggregatedSalesCompanies={aggregatedData.salesCompanies}
        dateFilter={dateFilter}
        selectedYear={selectedYear}
        selectedQuarter={selectedQuarter}
        selectedMonth={selectedMonth}
      />
    </motion.div>
  );
}
