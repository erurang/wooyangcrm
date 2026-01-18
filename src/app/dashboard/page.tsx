"use client";

import { Suspense } from "react";
import { useDashboard } from "@/context/dashboard";
import DashboardTab from "@/components/dashboard/tabs/DashboardTab";

function DashboardContent() {
  const { documentsDetails } = useDashboard();

  return <DashboardTab documentsDetails={documentsDetails} />;
}

export default function DashboardOverviewPage() {
  return (
    <Suspense fallback={<div className="p-5">로딩중...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
