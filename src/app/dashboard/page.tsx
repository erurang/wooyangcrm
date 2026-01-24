"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { useDashboard } from "@/context/dashboard";
import DashboardTab from "@/components/dashboard/tabs/DashboardTab";
import DashboardSkeleton from "@/components/skeleton/DashboardSkeleton";

function DashboardContent() {
  const { documentsDetails } = useDashboard();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DashboardTab documentsDetails={documentsDetails} />
    </motion.div>
  );
}

export default function DashboardOverviewPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
