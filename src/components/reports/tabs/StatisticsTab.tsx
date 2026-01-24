"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { DateFilterType, MonthlyStat } from "@/types/reports";
import { KPIGaugeChart, TrendComparisonChart } from "@/components/reports/charts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface StatisticsTabProps {
  year: number;
  dateFilter: DateFilterType;
  quarter?: number;
  month?: number;
  monthlyStats: MonthlyStat[];
  previousYearStats: MonthlyStat[];
  isLoading: boolean;
}

export default function StatisticsTab({
  year,
  dateFilter,
  quarter,
  month,
  monthlyStats,
  previousYearStats,
  isLoading,
}: StatisticsTabProps) {
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  // 필터링된 데이터 계산
  const filteredStats = useMemo(() => {
    if (dateFilter === "year") {
      return monthlyStats;
    } else if (dateFilter === "quarter" && quarter) {
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = quarter * 3;
      return monthlyStats.filter(
        (s) => s.month >= startMonth && s.month <= endMonth
      );
    } else if (dateFilter === "month" && month) {
      return monthlyStats.filter((s) => s.month === month);
    }
    return monthlyStats;
  }, [monthlyStats, dateFilter, quarter, month]);

  const filteredPrevStats = useMemo(() => {
    if (dateFilter === "year") {
      return previousYearStats;
    } else if (dateFilter === "quarter" && quarter) {
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = quarter * 3;
      return previousYearStats.filter(
        (s) => s.month >= startMonth && s.month <= endMonth
      );
    } else if (dateFilter === "month" && month) {
      return previousYearStats.filter((s) => s.month === month);
    }
    return previousYearStats;
  }, [previousYearStats, dateFilter, quarter, month]);

  // 합계 계산
  const totalSales = filteredStats.reduce((sum, s) => sum + s.sales, 0);
  const totalPurchases = filteredStats.reduce((sum, s) => sum + s.purchases, 0);
  const totalProfit = totalSales - totalPurchases;
  const totalSalesCount = filteredStats.reduce(
    (sum, s) => sum + s.salesCount,
    0
  );
  const totalPurchaseCount = filteredStats.reduce(
    (sum, s) => sum + s.purchaseCount,
    0
  );

  // 전년도 합계
  const prevTotalSales = filteredPrevStats.reduce((sum, s) => sum + s.sales, 0);
  const prevTotalPurchases = filteredPrevStats.reduce(
    (sum, s) => sum + s.purchases,
    0
  );

  // 성장률 계산
  const salesGrowth =
    prevTotalSales > 0
      ? ((totalSales - prevTotalSales) / prevTotalSales) * 100
      : 0;
  const purchaseGrowth =
    prevTotalPurchases > 0
      ? ((totalPurchases - prevTotalPurchases) / prevTotalPurchases) * 100
      : 0;

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
    legend: {
      position: "top",
      horizontalAlign: "right",
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value.toLocaleString()}원`,
      },
    },
    grid: {
      borderColor: "#e2e8f0",
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "60%",
      },
    },
  };

  const chartSeries = [
    {
      name: "매출",
      data: filteredStats.map((s) => s.sales),
    },
    {
      name: "매입",
      data: filteredStats.map((s) => s.purchases),
    },
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
    legend: {
      position: "top",
      horizontalAlign: "right",
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value.toLocaleString()}원`,
      },
    },
    grid: {
      borderColor: "#e2e8f0",
    },
  };

  const comparisonSeries = [
    {
      name: `${year}년 매출`,
      data: filteredStats.map((s) => s.sales),
    },
    {
      name: `${year - 1}년 매출`,
      data: filteredPrevStats.map((s) => s.sales),
    },
  ];

  if (isLoading) {
    return (
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
    );
  }

  return (
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

      {/* 목표 달성률 게이지 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIGaugeChart
          value={totalSales}
          target={totalSales * 1.2} // 목표는 실제 데이터로 교체 필요
          label="매출 달성률"
          unit="원"
        />
        <KPIGaugeChart
          value={totalPurchases}
          target={totalPurchases * 1.1}
          label="매입 달성률"
          unit="원"
        />
        <KPIGaugeChart
          value={totalSalesCount}
          target={Math.ceil(totalSalesCount * 1.15)}
          label="견적 달성률"
          unit="건"
        />
        <KPIGaugeChart
          value={totalPurchaseCount}
          target={Math.ceil(totalPurchaseCount * 1.1)}
          label="발주 달성률"
          unit="건"
        />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 매출/매입 추이 */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">
              매출/매입 추이
            </h3>
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

        {/* 전년 대비 매출 비교 */}
        <TrendComparisonChart
          title={`${year}년 vs ${year - 1}년 매출 비교`}
          currentYearData={filteredStats.map((s) => s.sales)}
          previousYearData={filteredPrevStats.map((s) => s.sales)}
          categories={filteredStats.map((s) => `${s.month}월`)}
          currentYearLabel={`${year}년`}
          previousYearLabel={`${year - 1}년`}
          valueFormatter={(v) =>
            v >= 100000000
              ? `${(v / 100000000).toFixed(1)}억`
              : v >= 10000
              ? `${(v / 10000).toFixed(0)}만`
              : v.toLocaleString()
          }
          showGrowth={true}
          color="#3b82f6"
        />

        {/* 전년 대비 매입 비교 */}
        <TrendComparisonChart
          title={`${year}년 vs ${year - 1}년 매입 비교`}
          currentYearData={filteredStats.map((s) => s.purchases)}
          previousYearData={filteredPrevStats.map((s) => s.purchases)}
          categories={filteredStats.map((s) => `${s.month}월`)}
          currentYearLabel={`${year}년`}
          previousYearLabel={`${year - 1}년`}
          valueFormatter={(v) =>
            v >= 100000000
              ? `${(v / 100000000).toFixed(1)}억`
              : v >= 10000
              ? `${(v / 10000).toFixed(0)}만`
              : v.toLocaleString()
          }
          showGrowth={true}
          color="#10b981"
        />
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
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  월
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                  매출
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                  매입
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                  순이익
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">
                  견적
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">
                  발주
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStats.map((stat) => {
                const profit = stat.sales - stat.purchases;
                return (
                  <tr key={stat.month} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {stat.month}월
                    </td>
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
                <td className="px-4 py-3 text-center text-slate-600">
                  {totalSalesCount}건
                </td>
                <td className="px-4 py-3 text-center text-slate-600">
                  {totalPurchaseCount}건
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
