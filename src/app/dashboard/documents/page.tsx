"use client";

import { useDashboard } from "@/context/dashboard";
import DocumentsTab from "@/components/dashboard/tabs/DocumentsTab";

export default function DashboardDocumentsPage() {
  const { documentTotals } = useDashboard();

  return (
    <DocumentsTab
      estimates={documentTotals.estimates}
      orders={documentTotals.orders}
      pendingSales={documentTotals.pendingSales}
      completedSales={documentTotals.completedSales}
      canceledSales={documentTotals.canceledSales}
      pendingPurchases={documentTotals.pendingPurchases}
      completedPurchases={documentTotals.completedPurchases}
      canceledPurchases={documentTotals.canceledPurchases}
    />
  );
}
