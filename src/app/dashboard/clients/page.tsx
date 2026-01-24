"use client";

import { motion } from "framer-motion";
import { useDashboard } from "@/context/dashboard";
import ClientsTab from "@/components/dashboard/tabs/ClientsTab";

export default function DashboardClientsPage() {
  const {
    clientAnalysisData,
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
      <ClientsTab
        clientAnalysisData={clientAnalysisData}
        dateFilter={dateFilter}
        selectedYear={selectedYear}
        selectedQuarter={selectedQuarter}
        selectedMonth={selectedMonth}
      />
    </motion.div>
  );
}
