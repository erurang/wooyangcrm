"use client";

import { DashboardProvider } from "@/context/dashboard";
import { DateFilterProvider } from "@/context/dateFilter";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="w-full p-3 md:p-5">
        {children}
      </div>
    </div>
  );
}

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DateFilterProvider>
      <DashboardProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </DashboardProvider>
    </DateFilterProvider>
  );
}
