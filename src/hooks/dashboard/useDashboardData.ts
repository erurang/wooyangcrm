"use client";

import { useMemo } from "react";
import {
  aggregateData,
  getChartData,
  calculateAllDocumentTotals,
  generateClientAnalysisData,
  calculatePerformanceMetrics,
  generateMonthlyTrendData,
  getExpiringDocuments,
} from "@/utils/dashboard-helpers";
import { DateFilterType } from "@/types/dateFilter";
import type {
  AggregatedItem,
  CompanyTotal,
  DashboardUserData,
  DashboardUser,
} from "@/types/dashboard";

interface UseDashboardDataProps {
  salesCompanies: CompanyTotal[];
  purchaseCompanies: CompanyTotal[];
  salesProducts: AggregatedItem[];
  purchaseProducts: AggregatedItem[];
  documentsDetails: DashboardUserData[];
  user: DashboardUser | null;
  dateFilter: DateFilterType;
  selectedMonth: number;
  selectedQuarter: number;
}

export function useDashboardData({
  salesCompanies,
  purchaseCompanies,
  salesProducts,
  purchaseProducts,
  documentsDetails,
  user,
  dateFilter,
  selectedMonth,
  selectedQuarter,
}: UseDashboardDataProps) {
  // 중복 데이터 제거 및 총합 계산
  const aggregatedData = useMemo(() => {
    const aggregatedSalesCompanies = aggregateData(
      salesCompanies || [],
      "name"
    );
    const aggregatedPurchaseCompanies = aggregateData(
      purchaseCompanies || [],
      "name"
    );
    const aggregatedSalesProducts = aggregateData(
      salesProducts || [],
      "spec"
    );
    const aggregatedPurchaseProducts = aggregateData(
      purchaseProducts || [],
      "spec"
    );

    return {
      salesCompanies: aggregatedSalesCompanies,
      purchaseCompanies: aggregatedPurchaseCompanies,
      salesProducts: aggregatedSalesProducts,
      purchaseProducts: aggregatedPurchaseProducts,
    };
  }, [salesCompanies, purchaseCompanies, salesProducts, purchaseProducts]);

  // 차트 데이터 생성
  const chartData = useMemo(() => {
    const salesChart = getChartData(aggregatedData.salesCompanies);
    const purchaseChart = getChartData(aggregatedData.purchaseCompanies);

    const salesItemData = aggregatedData.salesProducts
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((item) => ({
        name: item.name,
        value: item.total,
        type: "sales" as const,
      }));

    const purchaseItemData = aggregatedData.purchaseProducts
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((item) => ({
        name: item.name,
        value: item.total,
        type: "purchase" as const,
      }));

    return {
      salesChart,
      purchaseChart,
      itemsChartData: { salesData: salesItemData, purchaseData: purchaseItemData },
    };
  }, [aggregatedData]);

  // 문서 금액 합계 및 카운트 (단일 순회 최적화)
  const documentTotals = useMemo(
    () => calculateAllDocumentTotals(documentsDetails ?? []),
    [documentsDetails]
  );

  // 만료 예정 견적서
  const expiringDocuments = useMemo(() => {
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    return getExpiringDocuments(documentsDetails ?? [], today, sevenDaysLater);
  }, [documentsDetails]);

  // 거래처 분석 데이터
  const clientAnalysisData = useMemo(
    () => generateClientAnalysisData(documentsDetails ?? []),
    [documentsDetails]
  );

  // 월별 트렌드 데이터
  const monthlyTrendData = useMemo(
    () =>
      generateMonthlyTrendData(
        documentsDetails ?? [],
        dateFilter,
        selectedMonth,
        selectedQuarter
      ),
    [documentsDetails, dateFilter, selectedMonth, selectedQuarter]
  );

  // 성과 지표 (documentTotals에서 이미 계산된 estimates 사용)
  const performanceMetrics = useMemo(() => {
    return calculatePerformanceMetrics(
      user,
      documentTotals.completedSales,
      documentTotals.estimates,
      documentsDetails ?? []
    );
  }, [user, documentTotals.completedSales, documentTotals.estimates, documentsDetails]);

  return {
    aggregatedData,
    chartData,
    documentTotals,
    expiringDocuments,
    clientAnalysisData,
    monthlyTrendData,
    performanceMetrics,
  };
}
