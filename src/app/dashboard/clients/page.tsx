"use client";

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
    <ClientsTab
      clientAnalysisData={clientAnalysisData}
      dateFilter={dateFilter}
      selectedYear={selectedYear}
      selectedQuarter={selectedQuarter}
      selectedMonth={selectedMonth}
    />
  );
}
