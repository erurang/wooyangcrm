"use client";

import { motion } from "framer-motion";
import { useDashboard } from "@/context/dashboard";
import ConsultationTab from "@/components/dashboard/tabs/ConsultationTab";

export default function DashboardConsultationPage() {
  const { documentsDetails } = useDashboard();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ConsultationTab documentsDetails={documentsDetails} />
    </motion.div>
  );
}
