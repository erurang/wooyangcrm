"use client";

import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

import React, { useEffect, useState, useMemo } from "react";
import { useLoginUser } from "@/context/login";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  User,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";

interface PerformanceData {
  monthlyPurchases: number[];
  monthlySales: number[];
  productSummary: {
    sales: Record<string, number[]>;
    purchases: Record<string, number[]>;
  };
}

const PerformancePage = () => {
  const user = useLoginUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const year = searchParams.get("year") || currentYear.toString();

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedYear = e.target.value;
    router.push(`/reports/performance?year=${selectedYear}`);
  };

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoading(true);

      const res = await fetch(`/api/reports/performance?userId=${user?.id}&year=${year}`);
      const data = await res.json();

      if (res.ok) {
        const transformedData = {
          monthlyPurchases: data.monthlySummary.order || [],
          monthlySales: data.monthlySummary.estimate || [],
          productSummary: {
            sales: data.productSummary.estimate || {},
            purchases: data.productSummary.order || {},
          },
        };
        setPerformanceData(transformedData);
      } else {
        console.error("Failed to fetch performance data:", data.error);
      }

      setLoading(false);
    };

    if (user?.id) {
      fetchPerformanceData();
    }
  }, [user, year]);

  // 통계 계산
  const stats = useMemo(() => {
    if (!performanceData) return null;
    const totalSales = performanceData.monthlySales.reduce((a, b) => a + b, 0);
    const totalPurchases = performanceData.monthlyPurchases.reduce((a, b) => a + b, 0);
    const avgMonthlySales = totalSales / 12;
    const avgMonthlyPurchases = totalPurchases / 12;
    const salesProductCount = Object.keys(performanceData.productSummary.sales).length;
    const purchaseProductCount = Object.keys(performanceData.productSummary.purchases).length;

    // 전년 대비 (현재 데이터 기준 마지막 월과 처음 월 비교)
    const currentMonthSales = performanceData.monthlySales[performanceData.monthlySales.length - 1] || 0;
    const previousMonthSales = performanceData.monthlySales[performanceData.monthlySales.length - 2] || 0;
    const salesGrowth = previousMonthSales > 0 ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100 : 0;

    return {
      totalSales,
      totalPurchases,
      avgMonthlySales,
      avgMonthlyPurchases,
      salesProductCount,
      purchaseProductCount,
      salesGrowth,
    };
  }, [performanceData]);

  // 차트 옵션
  const areaChartOptions = (color: string, title: string) => ({
    chart: {
      type: "area" as const,
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    colors: [color],
    xaxis: {
      categories: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
    },
    yaxis: {
      title: { text: "단위: 백만원", style: { fontSize: "12px", color: "#64748b" } },
      labels: {
        formatter: (val: number) => `${(val / 1000000).toLocaleString()}`,
        style: { colors: "#64748b" },
      },
    },
    stroke: { curve: "smooth" as const, width: 2 },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.4, opacityTo: 0.1 },
    },
    tooltip: {
      y: { formatter: (val: number) => `${val.toLocaleString()}원` },
    },
    title: {
      text: title,
      style: { fontSize: "14px", fontWeight: 600, color: "#1e293b" },
    },
    grid: { borderColor: "#e2e8f0" },
  });

  const barChartOptions = (colors: string[], title: string) => ({
    chart: {
      type: "bar" as const,
      stacked: true,
      stackType: "100%" as const,
      toolbar: { show: true },
    },
    colors,
    plotOptions: {
      bar: { horizontal: true, borderRadius: 4 },
    },
    xaxis: {
      categories: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `${val}%`,
        style: { colors: "#64748b" },
      },
    },
    tooltip: {
      y: { formatter: (val: number) => `${val.toLocaleString()}원` },
    },
    title: {
      text: title,
      style: { fontSize: "14px", fontWeight: 600, color: "#1e293b" },
    },
    legend: { position: "bottom" as const, fontSize: "12px" },
    grid: { borderColor: "#e2e8f0" },
  });

  const salesChartSeries = [
    { name: "매출", data: performanceData?.monthlySales || [] },
  ];

  const purchaseChartSeries = [
    { name: "매입", data: performanceData?.monthlyPurchases || [] },
  ];

  const salesProductChartSeries = performanceData?.productSummary.sales
    ? Object.entries(performanceData.productSummary.sales).map(([product, data]) => ({
        name: product,
        data,
      }))
    : [];

  const purchaseProductChartSeries = performanceData?.productSummary.purchases
    ? Object.entries(performanceData.productSummary.purchases).map(([product, data]) => ({
        name: product,
        data,
      }))
    : [];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 mt-4">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-sm">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">
                  {user?.name} {user?.level}님의 영업 성과
                </h1>
                {parseInt(year) <= 2024 && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                    2024년 이전 데이터는 정확하지 않을 수 있습니다
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{year}년 매입 및 매출 실적을 확인하세요</p>
            </div>
          </div>

          {/* 연도 선택 */}
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={year}
              onChange={handleYearChange}
              className="border border-slate-200 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-700"
            >
              {Array.from({ length: 10 }, (_, i) => currentYear - i).map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI 카드 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">총 매출</span>
              </div>
              <p className="text-xl font-bold text-emerald-600">
                {(stats.totalSales / 10000).toLocaleString()}
                <span className="text-xs font-normal ml-1">만원</span>
              </p>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-xs font-medium text-red-700">총 매입</span>
              </div>
              <p className="text-xl font-bold text-red-600">
                {(stats.totalPurchases / 10000).toLocaleString()}
                <span className="text-xs font-normal ml-1">만원</span>
              </p>
            </div>

            <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-medium text-sky-700">월평균 매출</span>
              </div>
              <p className="text-xl font-bold text-sky-600">
                {(stats.avgMonthlySales / 10000).toLocaleString()}
                <span className="text-xs font-normal ml-1">만원</span>
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">월평균 매입</span>
              </div>
              <p className="text-xl font-bold text-purple-600">
                {(stats.avgMonthlyPurchases / 10000).toLocaleString()}
                <span className="text-xs font-normal ml-1">만원</span>
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">매출 품목</span>
              </div>
              <p className="text-xl font-bold text-amber-600">
                {stats.salesProductCount}
                <span className="text-xs font-normal ml-1">종</span>
              </p>
            </div>

            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {stats.salesGrowth >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-teal-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs font-medium text-teal-700">전월 대비</span>
              </div>
              <p className={`text-xl font-bold ${stats.salesGrowth >= 0 ? "text-teal-600" : "text-red-600"}`}>
                {stats.salesGrowth >= 0 ? "+" : ""}
                {stats.salesGrowth.toFixed(1)}
                <span className="text-xs font-normal ml-1">%</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 차트 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 월별 매출 추이 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-semibold text-slate-800">월별 매출 추이</h3>
          </div>
          <ReactApexChart
            options={areaChartOptions("#10b981", "")}
            series={salesChartSeries}
            type="area"
            height={300}
          />
        </div>

        {/* 월별 매입 추이 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-semibold text-slate-800">월별 매입 추이</h3>
          </div>
          <ReactApexChart
            options={areaChartOptions("#ef4444", "")}
            series={purchaseChartSeries}
            type="area"
            height={300}
          />
        </div>

        {/* 매출 품목별 비중 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-sky-500" />
            <h3 className="text-base font-semibold text-slate-800">매출 품목별 월별 비중</h3>
          </div>
          {salesProductChartSeries.length > 0 ? (
            <ReactApexChart
              options={barChartOptions(
                ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"],
                ""
              )}
              series={salesProductChartSeries}
              type="bar"
              height={300}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-400">
              데이터가 없습니다
            </div>
          )}
        </div>

        {/* 매입 품목별 비중 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-semibold text-slate-800">매입 품목별 월별 비중</h3>
          </div>
          {purchaseProductChartSeries.length > 0 ? (
            <ReactApexChart
              options={barChartOptions(
                ["#a855f7", "#c084fc", "#d8b4fe", "#e9d5ff", "#f3e8ff"],
                ""
              )}
              series={purchaseProductChartSeries}
              type="bar"
              height={300}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-400">
              데이터가 없습니다
            </div>
          )}
        </div>
      </div>

      {/* 비교 차트 */}
      <div className="mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-sky-500" />
            <h3 className="text-base font-semibold text-slate-800">매출 vs 매입 비교</h3>
          </div>
          <ReactApexChart
            options={{
              chart: { type: "bar", toolbar: { show: true } },
              colors: ["#10b981", "#ef4444"],
              xaxis: {
                categories: ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"],
              },
              yaxis: {
                labels: {
                  formatter: (val: number) => `${(val / 1000000).toLocaleString()}백만`,
                  style: { colors: "#64748b" },
                },
              },
              plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
              dataLabels: { enabled: false },
              legend: { position: "top" },
              grid: { borderColor: "#e2e8f0" },
            }}
            series={[
              { name: "매출", data: performanceData?.monthlySales || [] },
              { name: "매입", data: performanceData?.monthlyPurchases || [] },
            ]}
            type="bar"
            height={350}
          />
        </div>
      </div>
    </div>
  );
};

export default PerformancePage;
