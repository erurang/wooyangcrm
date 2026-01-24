"use client";

import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <TrendsTab
        monthlyTrendData={monthlyTrendData}
        dateFilter={dateFilter}
        selectedYear={selectedYear}
        selectedQuarter={selectedQuarter}
        selectedMonth={selectedMonth}
      />
    </motion.div>
  );
}
