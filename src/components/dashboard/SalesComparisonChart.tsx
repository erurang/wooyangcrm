"use client";

import dynamic from "next/dynamic";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-400">차트 로딩중</span>
      </div>
    </div>
  ),
});

interface YearlyData {
  year: number;
  sales: number[];
  purchases: number[];
}

interface SalesComparisonChartProps {
  months: string[];
  currentYear: YearlyData;
  previousYear: YearlyData;
  isLoading?: boolean;
}

export default function SalesComparisonChart({
  months,
  currentYear,
  previousYear,
  isLoading = false,
}: SalesComparisonChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4">
        <div className="flex items-center mb-3">
          <div className="p-1.5 bg-emerald-50 rounded-lg mr-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">매출/매입 추이</h2>
        </div>
        <div className="h-[250px] animate-pulse bg-slate-50 rounded-xl" />
      </div>
    );
  }

  if (!currentYear?.year || !previousYear?.year) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4">
        <div className="flex items-center mb-3">
          <div className="p-1.5 bg-emerald-50 rounded-lg mr-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">매출/매입 추이</h2>
        </div>
        <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
          데이터를 불러올 수 없습니다
        </div>
      </div>
    );
  }

  const series = [
    {
      name: `${currentYear.year}년 매출`,
      data: currentYear.sales,
      type: "line" as const,
    },
    {
      name: `${previousYear.year}년 매출`,
      data: previousYear.sales,
      type: "line" as const,
    },
    {
      name: `${currentYear.year}년 매입`,
      data: currentYear.purchases,
      type: "line" as const,
    },
    {
      name: `${previousYear.year}년 매입`,
      data: previousYear.purchases,
      type: "line" as const,
    },
  ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: "inherit",
    },
    stroke: {
      width: [3, 1.5, 3, 1.5],
      curve: "smooth",
      dashArray: [0, 6, 0, 6],
    },
    colors: ["#0284c7", "#7dd3fc", "#059669", "#6ee7b7"],
    fill: {
      type: ["solid", "solid", "solid", "solid"],
      opacity: [1, 0.6, 1, 0.6],
    },
    xaxis: {
      categories: months,
      labels: {
        style: { fontSize: "11px", colors: "#94a3b8", fontWeight: 500 },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", colors: "#94a3b8" },
        formatter: (val: number) => {
          if (val >= 100000000) return `${(val / 100000000).toFixed(1)}억`;
          if (val >= 10000) return `${(val / 10000).toFixed(0)}만`;
          return val.toLocaleString();
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontSize: "11px",
      fontWeight: 600,
      markers: { size: 5, offsetX: -3 },
      itemMargin: { horizontal: 8 },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toLocaleString()}원`,
      },
    },
    grid: {
      borderColor: "#f1f5f9",
      strokeDashArray: 4,
      padding: { left: 8, right: 8 },
    },
    markers: {
      size: 0,
      hover: { size: 5, sizeOffset: 2 },
    },
  };

  const currentYearTotalSales = currentYear.sales.reduce((a, b) => a + b, 0);
  const previousYearTotalSales = previousYear.sales.reduce((a, b) => a + b, 0);
  const salesGrowth = previousYearTotalSales > 0
    ? ((currentYearTotalSales - previousYearTotalSales) / previousYearTotalSales) * 100
    : 0;

  const formatTotal = (val: number) => {
    if (val >= 100000000) return `${(val / 100000000).toFixed(1)}억`;
    if (val >= 10000) return `${(val / 10000).toFixed(0)}만`;
    return val.toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <div className="p-1.5 bg-emerald-50 rounded-lg mr-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">매출/매입 추이</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">올해 매출</p>
            <p className="text-sm font-bold text-sky-700 tabular-nums">
              {formatTotal(currentYearTotalSales)}
            </p>
          </div>
          <div className={`
            flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-bold tabular-nums
            ${salesGrowth >= 0
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
            }
          `}>
            {salesGrowth >= 0
              ? <ArrowUpRight className="h-3.5 w-3.5" />
              : <ArrowDownRight className="h-3.5 w-3.5" />
            }
            {salesGrowth >= 0 ? "+" : ""}{salesGrowth.toFixed(1)}%
          </div>
        </div>
      </div>
      <ReactApexChart
        type="line"
        series={series}
        options={options}
        height={250}
      />
    </div>
  );
}
