"use client";

import { motion } from "framer-motion";
import { useDashboard } from "@/context/dashboard";
import DocumentsTab from "@/components/dashboard/tabs/DocumentsTab";

export default function DashboardDocumentsPage() {
  const { documentTotals } = useDashboard();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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
    </motion.div>
  );
}
