"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronLeft,
  Calendar,
  Building2,
  Package,
} from "lucide-react";
import { useUserDetail } from "@/hooks/useUserDetail";
import { useUserReportStatistics } from "@/hooks/reports/useUserReportStatistics";
import { useUserTransactions } from "@/hooks/reports/userDetail/useUserTransactions";
import type { DateFilterType } from "@/types/reports";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type TabType = "statistics" | "companies" | "items";

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "statistics", label: "매출/매입 통계", icon: TrendingUp },
  { id: "companies", label: "거래처별 실적", icon: Building2 },
  { id: "items", label: "품목별 실적", icon: Package },
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
const QUARTERS = [1, 2, 3, 4];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

interface Company {
  name: string;
  total: number;
}

interface Item {
  name: string;
  spec?: string;
  total: number;
}

export default function PerformanceDetailClient() {
  const { id } = useParams();
  const router = useRouter();
  const userId = Array.isArray(id) ? id[0] : id || "";

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>("statistics");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  // 필터 상태
  const [dateFilter, setDateFilter] = useState<DateFilterType>("year");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(
    Math.ceil((new Date().getMonth() + 1) / 3)
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // 데이터 가져오기
  const { user, isLoading: isUserLoading } = useUserDetail(userId);
  const { monthlyStats, previousYearStats, isLoading: isStatsLoading } =
    useUserReportStatistics(userId, selectedYear, dateFilter, selectedQuarter, selectedMonth);

  // 날짜 범위 계산
  const dateRange = useMemo(() => {
    let startDate: string, endDate: string;
    if (dateFilter === "year") {
      startDate = `${selectedYear}-01-01`;
      endDate = `${selectedYear}-12-31`;
    } else if (dateFilter === "quarter") {
      const startMonth = (selectedQuarter - 1) * 3 + 1;
      const endMonth = selectedQuarter * 3;
      startDate = `${selectedYear}-${String(startMonth).padStart(2, "0")}-01`;
      endDate = `${selectedYear}-${String(endMonth).padStart(2, "0")}-${new Date(selectedYear, endMonth, 0).getDate()}`;
    } else {
      startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      endDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${new Date(selectedYear, selectedMonth, 0).getDate()}`;
    }
    return { startDate, endDate };
  }, [selectedYear, dateFilter, selectedQuarter, selectedMonth]);

  const { salesCompanies, purchaseCompanies, salesProducts, purchaseProducts } =
    useUserTransactions(userId, dateRange.startDate, dateRange.endDate);

  // 필터링된 데이터 계산
  const filteredStats = useMemo(() => {
    if (dateFilter === "year") {
      return monthlyStats;
    } else if (dateFilter === "quarter") {
      const startMonth = (selectedQuarter - 1) * 3 + 1;
      const endMonth = selectedQuarter * 3;
      return monthlyStats.filter((s) => s.month >= startMonth && s.month <= endMonth);
    } else if (dateFilter === "month") {
      return monthlyStats.filter((s) => s.month === selectedMonth);
    }
    return monthlyStats;
  }, [monthlyStats, dateFilter, selectedQuarter, selectedMonth]);

  const filteredPrevStats = useMemo(() => {
    if (dateFilter === "year") {
      return previousYearStats;
    } else if (dateFilter === "quarter") {
      const startMonth = (selectedQuarter - 1) * 3 + 1;
      const endMonth = selectedQuarter * 3;
      return previousYearStats.filter((s) => s.month >= startMonth && s.month <= endMonth);
    } else if (dateFilter === "month") {
      return previousYearStats.filter((s) => s.month === selectedMonth);
    }
    return previousYearStats;
  }, [previousYearStats, dateFilter, selectedQuarter, selectedMonth]);

  // 합계 계산
  const totalSales = filteredStats.reduce((sum, s) => sum + s.sales, 0);
  const totalPurchases = filteredStats.reduce((sum, s) => sum + s.purchases, 0);
  const totalProfit = totalSales - totalPurchases;
  const totalSalesCount = filteredStats.reduce((sum, s) => sum + s.salesCount, 0);
  const totalPurchaseCount = filteredStats.reduce((sum, s) => sum + s.purchaseCount, 0);

  // 전년도 합계
  const prevTotalSales = filteredPrevStats.reduce((sum, s) => sum + s.sales, 0);
  const prevTotalPurchases = filteredPrevStats.reduce((sum, s) => sum + s.purchases, 0);

  // 성장률 계산
  const salesGrowth = prevTotalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;
  const purchaseGrowth = prevTotalPurchases > 0 ? ((totalPurchases - prevTotalPurchases) / prevTotalPurchases) * 100 : 0;

  // 중복 제거 함수
  const aggregateData = <T extends { name: string; total: number }>(data: T[]): T[] => {
    return Object.values(
      data.reduce<Record<string, T>>((acc, item) => {
        if (!acc[item.name]) {
          acc[item.name] = { ...item };
        } else {
          acc[item.name].total += item.total;
        }
        return acc;
      }, {})
    );
  };

  const aggregatedSalesCompanies = aggregateData(salesCompanies || []) as Company[];
  const aggregatedPurchaseCompanies = aggregateData(purchaseCompanies || []) as Company[];
  const aggregatedSalesProducts = aggregateData(salesProducts || []) as Item[];
  const aggregatedPurchaseProducts = aggregateData(purchaseProducts || []) as Item[];

  // 차트 옵션
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: chartType,
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    colors: ["#3b82f6", "#10b981"],
    xaxis: {
      categories: filteredStats.map((s) => `${s.month}월`),
    },
    yaxis: {
      labels: {
        formatter: (value: number) =>
          value >= 100000000
            ? `${(value / 100000000).toFixed(1)}억`
            : value >= 10000
            ? `${(value / 10000).toFixed(0)}만`
            : value.toLocaleString(),
      },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: chartType === "line" ? 3 : 0 },
    legend: { position: "top", horizontalAlign: "right" },
    tooltip: {
      y: { formatter: (value: number) => `${value.toLocaleString()}원` },
    },
    grid: { borderColor: "#e2e8f0" },
    plotOptions: {
      bar: { borderRadius: 4, columnWidth: "60%" },
    },
  };

  const chartSeries = [
    { name: "매출", data: filteredStats.map((s) => s.sales) },
    { name: "매입", data: filteredStats.map((s) => s.purchases) },
  ];

  // 전년 대비 차트
  const comparisonOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    colors: ["#3b82f6", "#94a3b8"],
    xaxis: {
      categories: filteredStats.map((s) => `${s.month}월`),
    },
    yaxis: {
      labels: {
        formatter: (value: number) =>
          value >= 100000000
            ? `${(value / 100000000).toFixed(1)}억`
            : value >= 10000
            ? `${(value / 10000).toFixed(0)}만`
            : value.toLocaleString(),
      },
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 3, dashArray: [0, 5] },
    legend: { position: "top", horizontalAlign: "right" },
    tooltip: {
      y: { formatter: (value: number) => `${value.toLocaleString()}원` },
    },
    grid: { borderColor: "#e2e8f0" },
  };

  const comparisonSeries = [
    { name: `${selectedYear}년 매출`, data: filteredStats.map((s) => s.sales) },
    { name: `${selectedYear - 1}년 매출`, data: filteredPrevStats.map((s) => s.sales) },
  ];

  const isLoading = isUserLoading || isStatsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-slate-200 p-4 h-24 animate-pulse"
              >
                <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 h-80 animate-pulse">
            <div className="h-full bg-slate-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          {/* 사용자 정보 */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.push("/reports/users")}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                {user?.name}
                {user?.position && (
                  <span className="text-xs font-normal text-slate-500">{user.position}</span>
                )}
              </h1>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex items-center gap-1 mb-3">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 필터 영역 */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* 기간 유형 선택 */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              {(["year", "quarter", "month"] as DateFilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setDateFilter(type)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    dateFilter === type
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {type === "year" ? "연간" : type === "quarter" ? "분기" : "월간"}
                </button>
              ))}
            </div>

            {/* 연도 선택 */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            {/* 분기 선택 */}
            {dateFilter === "quarter" && (
              <div className="relative">
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                  className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {QUARTERS.map((q) => (
                    <option key={q} value={q}>
                      {q}분기
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* 월 선택 */}
            {dateFilter === "month" && (
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}월
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            )}

            {/* 현재 기간 표시 */}
            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>
                {dateFilter === "year"
                  ? `${selectedYear}년 전체`
                  : dateFilter === "quarter"
                  ? `${selectedYear}년 ${selectedQuarter}분기`
                  : `${selectedYear}년 ${selectedMonth}월`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="p-4">
        {activeTab === "statistics" && (
          <div className="space-y-4">
            {/* KPI 카드 */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {/* 총 매출 */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-slate-500 text-xs">
                    <DollarSign className="h-3.5 w-3.5 mr-1" />
                    총 매출
                  </div>
                  {salesGrowth !== 0 && (
                    <span
                      className={`text-xs flex items-center ${
                        salesGrowth > 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {salesGrowth > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(salesGrowth).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  {totalSales >= 100000000
                    ? `${(totalSales / 100000000).toFixed(1)}억`
                    : `${(totalSales / 10000).toLocaleString()}만`}
                </p>
              </div>

              {/* 총 매입 */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-slate-500 text-xs">
                    <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                    총 매입
                  </div>
                  {purchaseGrowth !== 0 && (
                    <span
                      className={`text-xs flex items-center ${
                        purchaseGrowth < 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {purchaseGrowth > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(purchaseGrowth).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  {totalPurchases >= 100000000
                    ? `${(totalPurchases / 100000000).toFixed(1)}억`
                    : `${(totalPurchases / 10000).toLocaleString()}만`}
                </p>
              </div>

              {/* 순이익 */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <div className="flex items-center text-slate-500 text-xs">
                  {totalProfit >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 mr-1 text-red-500" />
                  )}
                  순이익
                </div>
                <p
                  className={`text-xl font-bold mt-1 ${
                    totalProfit >= 0 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {totalProfit >= 100000000
                    ? `${(totalProfit / 100000000).toFixed(1)}억`
                    : totalProfit <= -100000000
                    ? `-${(Math.abs(totalProfit) / 100000000).toFixed(1)}억`
                    : `${(totalProfit / 10000).toLocaleString()}만`}
                </p>
              </div>

              {/* 견적 건수 */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <div className="flex items-center text-slate-500 text-xs">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  견적 건수
                </div>
                <p className="text-xl font-bold text-blue-600 mt-1">
                  {totalSalesCount.toLocaleString()}건
                </p>
              </div>

              {/* 발주 건수 */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <div className="flex items-center text-slate-500 text-xs">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  발주 건수
                </div>
                <p className="text-xl font-bold text-emerald-600 mt-1">
                  {totalPurchaseCount.toLocaleString()}건
                </p>
              </div>
            </div>

            {/* 차트 영역 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 매출/매입 추이 */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-800">매출/매입 추이</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setChartType("bar")}
                      className={`px-2 py-1 text-xs rounded ${
                        chartType === "bar"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      막대
                    </button>
                    <button
                      onClick={() => setChartType("line")}
                      className={`px-2 py-1 text-xs rounded ${
                        chartType === "line"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      선
                    </button>
                  </div>
                </div>
                <div className="h-72">
                  <Chart
                    options={chartOptions}
                    series={chartSeries}
                    type={chartType}
                    height="100%"
                  />
                </div>
              </div>

              {/* 전년 대비 */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">전년 대비 매출</h3>
                <div className="h-72">
                  <Chart
                    options={comparisonOptions}
                    series={comparisonSeries}
                    type="line"
                    height="100%"
                  />
                </div>
              </div>
            </div>

            {/* 월별 상세 테이블 */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800">월별 상세</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">월</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">매출</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">매입</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">순이익</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">견적</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">발주</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStats.map((stat) => {
                      const profit = stat.sales - stat.purchases;
                      return (
                        <tr key={stat.month} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-700">{stat.month}월</td>
                          <td className="px-4 py-3 text-right text-blue-600">
                            {stat.sales.toLocaleString()}원
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-600">
                            {stat.purchases.toLocaleString()}원
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-medium ${
                              profit >= 0 ? "text-slate-700" : "text-red-500"
                            }`}
                          >
                            {profit.toLocaleString()}원
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">
                            {stat.salesCount}건
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600">
                            {stat.purchaseCount}건
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-medium">
                    <tr>
                      <td className="px-4 py-3 text-slate-700">합계</td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        {totalSales.toLocaleString()}원
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600">
                        {totalPurchases.toLocaleString()}원
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${
                          totalProfit >= 0 ? "text-slate-700" : "text-red-500"
                        }`}
                      >
                        {totalProfit.toLocaleString()}원
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{totalSalesCount}건</td>
                      <td className="px-4 py-3 text-center text-slate-600">{totalPurchaseCount}건</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "companies" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 매출 거래처 TOP */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  매출 TOP 거래처
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {aggregatedSalesCompanies
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 10)
                  .map((company, idx) => (
                    <div
                      key={`sales-${company.name}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx < 3
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]">
                          {company.name}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-blue-600">
                        {(company.total / 10000).toLocaleString()}만
                      </span>
                    </div>
                  ))}
                {aggregatedSalesCompanies.length === 0 && (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    데이터가 없습니다
                  </div>
                )}
              </div>
            </div>

            {/* 매입 거래처 TOP */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-emerald-500" />
                  매입 TOP 거래처
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {aggregatedPurchaseCompanies
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 10)
                  .map((company, idx) => (
                    <div
                      key={`purchase-${company.name}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx < 3
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]">
                          {company.name}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">
                        {(company.total / 10000).toLocaleString()}만
                      </span>
                    </div>
                  ))}
                {aggregatedPurchaseCompanies.length === 0 && (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    데이터가 없습니다
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "items" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 매출 품목 TOP */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  매출 TOP 품목
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {aggregatedSalesProducts
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 10)
                  .map((item, idx) => (
                    <div
                      key={`sales-item-${item.name}-${idx}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx < 3
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-sm font-medium text-slate-700 block truncate max-w-[180px]">
                            {item.name}
                          </span>
                          {item.spec && (
                            <span className="text-xs text-slate-400">{item.spec}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-blue-600">
                        {(item.total / 10000).toLocaleString()}만
                      </span>
                    </div>
                  ))}
                {aggregatedSalesProducts.length === 0 && (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    데이터가 없습니다
                  </div>
                )}
              </div>
            </div>

            {/* 매입 품목 TOP */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-500" />
                  매입 TOP 품목
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {aggregatedPurchaseProducts
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 10)
                  .map((item, idx) => (
                    <div
                      key={`purchase-item-${item.name}-${idx}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx < 3
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-sm font-medium text-slate-700 block truncate max-w-[180px]">
                            {item.name}
                          </span>
                          {item.spec && (
                            <span className="text-xs text-slate-400">{item.spec}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">
                        {(item.total / 10000).toLocaleString()}만
                      </span>
                    </div>
                  ))}
                {aggregatedPurchaseProducts.length === 0 && (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    데이터가 없습니다
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
