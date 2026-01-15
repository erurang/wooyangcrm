"use client";

import { useDashboard } from "@/context/dashboard";
import PerformanceTab from "@/components/dashboard/tabs/PerformanceTab";

export default function DashboardPerformancePage() {
  const { performanceMetrics, user, documentTotals, documentsDetails } =
    useDashboard();

  // Safely calculate total consultations
  const totalConsultations = Array.isArray(documentsDetails)
    ? documentsDetails.flatMap((u: any) => u.consultations ?? []).length
    : 0;

  return (
    <PerformanceTab
      performanceMetrics={performanceMetrics}
      userTarget={user?.target}
      completedSales={documentTotals.completedSales}
      estimates={documentTotals.estimates}
      totalConsultations={totalConsultations}
    />
  );
}
