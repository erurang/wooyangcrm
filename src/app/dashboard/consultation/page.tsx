"use client";

import { useDashboard } from "@/context/dashboard";
import ConsultationTab from "@/components/dashboard/tabs/ConsultationTab";

export default function DashboardConsultationPage() {
  const { documentsDetails } = useDashboard();

  return <ConsultationTab documentsDetails={documentsDetails} />;
}
