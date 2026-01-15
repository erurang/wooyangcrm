"use client";

import { useDashboard } from "@/context/dashboard";
import DashboardTab from "@/components/dashboard/tabs/DashboardTab";

export default function DashboardOverviewPage() {
  const { followUpClients, expiringDocuments } = useDashboard();

  return (
    <DashboardTab
      followUpClients={followUpClients}
      expiringDocuments={expiringDocuments}
    />
  );
}
