"use client";

import { createContext, useContext, ReactNode } from "react";
import { useDateRange } from "@/hooks/dashboard/useDateRange";
import { useDashboardData } from "@/hooks/dashboard/useDashboardData";
import { useUserDetail } from "@/hooks/useUserDetail";
import { useUserTransactions } from "@/hooks/reports/userDetail/useUserTransactions";
import { useUserDocumentList } from "@/hooks/reports/userDetail/documents/useUserDocumentList";
import { useLoginLogs } from "@/hooks/dashboard/useLoginLogs";
import { useClientSummary } from "@/hooks/dashboard/useClientSummary";
import { useLoginUser } from "@/context/login";
import type { DateFilterType } from "@/types/dateFilter";
import type { DashboardUserData } from "@/types/dashboard";

// Dashboard Context 타입 (하위 호환을 위해 유연한 타입 사용)
interface DashboardContextType {
  // Date filter
  dateFilter: DateFilterType;
  selectedYear: number;
  selectedQuarter: number;
  selectedMonth: number;
  startDate: string;
  endDate: string;
  setDateFilter: (filter: DateFilterType) => void;
  setSelectedYear: (year: number) => void;
  setSelectedQuarter: (quarter: number) => void;
  setSelectedMonth: (month: number) => void;
  // User
  userId: string;
  user: { id: string; name: string; target?: number; level?: string; position?: string } | null;
  // Raw data
  salesCompanies: { name: string; total: number }[];
  purchaseCompanies: { name: string; total: number }[];
  salesProducts: { name: string; spec?: string; quantity: string; total: number }[];
  purchaseProducts: { name: string; spec?: string; quantity: string; total: number }[];
  documentsDetails: DashboardUserData[];
  loginLogs: { id: string; user_id: string; login_at: string; ip_address?: string }[];
  followUpClients: { id: string; company_id: string; company_name: string; follow_date: string; last_consultation?: string }[];
  clients: { id: string; name: string }[];
  // Processed data
  aggregatedData: {
    salesCompanies: { name: string; total: number }[];
    purchaseCompanies: { name: string; total: number }[];
    salesProducts: { name: string; spec?: string; quantity: string; total: number }[];
    purchaseProducts: { name: string; spec?: string; quantity: string; total: number }[];
  };
  chartData: {
    salesChart: { labels: string[]; data: number[] };
    purchaseChart: { labels: string[]; data: number[] };
    itemsChartData: {
      salesData: { name: string; value: number; type: "sales" }[];
      purchaseData: { name: string; value: number; type: "purchase" }[];
    };
  };
  documentTotals: {
    completedSales: number;
    completedPurchases: number;
    pendingSales: number;
    pendingPurchases: number;
    canceledSales: number;
    canceledPurchases: number;
    estimates: { pending: number; completed: number; canceled: number; total: number };
    orders: { pending: number; completed: number; canceled: number; total: number };
  };
  expiringDocuments: { id: string; company_name: string; valid_until: string; total_amount: number }[];
  clientAnalysisData: { id: string; name: string; consultations: number; estimates: number; orders: number; totalSales: number; totalPurchases: number }[];
  monthlyTrendData: { months: string[]; salesData: number[]; purchaseData: number[] };
  performanceMetrics: {
    targetAchievementRate: number;
    estimateSuccessRate: number;
    avgTransactionAmount: number;
    minTransactionAmount: number;
    maxTransactionAmount: number;
    consultationToEstimateRate: number;
  };
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const loginUser = useLoginUser();
  const userId = loginUser?.id || "";

  // Date filter
  const {
    dateFilter,
    selectedYear,
    selectedQuarter,
    selectedMonth,
    dateRange,
    setDateFilter,
    setSelectedYear,
    setSelectedQuarter,
    setSelectedMonth,
  } = useDateRange();

  const { startDate, endDate } = dateRange;

  // Data hooks
  const { user } = useUserDetail(userId);
  const { salesCompanies, purchaseCompanies, salesProducts, purchaseProducts } =
    useUserTransactions(userId, startDate, endDate);
  const { documentsDetails } = useUserDocumentList(userId, startDate, endDate);
  const { loginLogs } = useLoginLogs(userId);
  const { followUpClients, clients } = useClientSummary(userId);

  // Dashboard data hook
  const {
    aggregatedData,
    chartData,
    documentTotals,
    expiringDocuments,
    clientAnalysisData,
    monthlyTrendData,
    performanceMetrics,
  } = useDashboardData({
    salesCompanies,
    purchaseCompanies,
    salesProducts,
    purchaseProducts,
    documentsDetails,
    user,
    dateFilter,
    selectedMonth,
    selectedQuarter,
  });

  return (
    <DashboardContext.Provider
      value={{
        dateFilter,
        selectedYear,
        selectedQuarter,
        selectedMonth,
        startDate,
        endDate,
        setDateFilter,
        setSelectedYear,
        setSelectedQuarter,
        setSelectedMonth,
        userId,
        user,
        salesCompanies,
        purchaseCompanies,
        salesProducts,
        purchaseProducts,
        documentsDetails,
        loginLogs,
        followUpClients,
        clients,
        aggregatedData,
        chartData,
        documentTotals,
        expiringDocuments,
        clientAnalysisData,
        monthlyTrendData,
        performanceMetrics,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
