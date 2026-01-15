"use client";

import { DashboardProvider, useDashboard } from "@/context/dashboard";
import UserInfoCard from "@/components/dashboard/UserInfoCard";
import DateFilterCard from "@/components/dashboard/DateFilterCard";

function DashboardHeader() {
  const {
    user,
    loginLogs,
    dateFilter,
    selectedYear,
    selectedQuarter,
    selectedMonth,
    setDateFilter,
    setSelectedYear,
    setSelectedQuarter,
    setSelectedMonth,
  } = useDashboard();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
      <UserInfoCard
        userName={user?.name}
        userLevel={user?.level}
        userPosition={user?.position}
        targetAmount={user?.target}
        loginIp={loginLogs?.[0]?.ip_address}
        loginTime={loginLogs?.[0]?.login_at}
      />
      <DateFilterCard
        dateFilter={dateFilter}
        selectedYear={selectedYear}
        selectedQuarter={selectedQuarter}
        selectedMonth={selectedMonth}
        onDateFilterChange={setDateFilter}
        onYearChange={setSelectedYear}
        onQuarterChange={setSelectedQuarter}
        onMonthChange={setSelectedMonth}
      />
    </div>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="w-full p-5">
        <DashboardHeader />
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
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
