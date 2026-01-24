"use client";

import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PurchaseTab
        purchaseChart={chartData.purchaseChart}
        itemsChartData={chartData.itemsChartData}
        aggregatedPurchaseCompanies={aggregatedData.purchaseCompanies}
        dateFilter={dateFilter}
        selectedYear={selectedYear}
        selectedQuarter={selectedQuarter}
        selectedMonth={selectedMonth}
      />
    </motion.div>
  );
}
