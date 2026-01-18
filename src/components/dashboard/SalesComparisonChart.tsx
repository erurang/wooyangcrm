"use client";

import dynamic from "next/dynamic";
import { TrendingUp } from "lucide-react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] flex items-center justify-center">
      <div className="animate-pulse text-slate-400">차트 로딩중...</div>
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
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center mb-3">
          <TrendingUp className="h-4 w-4 text-emerald-600 mr-2" />
          <h2 className="text-sm font-semibold text-slate-800">매출/매입 추이</h2>
        </div>
        <div className="h-[250px] animate-pulse bg-slate-100 rounded"></div>
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
    },
    stroke: {
      width: [3, 2, 3, 2],
      curve: "smooth",
      dashArray: [0, 5, 0, 5],
    },
    colors: ["#3b82f6", "#93c5fd", "#10b981", "#6ee7b7"],
    xaxis: {
      categories: months,
      labels: {
        style: { fontSize: "11px", colors: "#64748b" },
      },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", colors: "#64748b" },
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
      markers: { size: 6 },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toLocaleString()}원`,
      },
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 3,
    },
    markers: {
      size: 4,
      hover: { size: 6 },
    },
  };

  // Calculate totals for summary
  const currentYearTotalSales = currentYear.sales.reduce((a, b) => a + b, 0);
  const previousYearTotalSales = previousYear.sales.reduce((a, b) => a + b, 0);
  const salesGrowth = previousYearTotalSales > 0
    ? ((currentYearTotalSales - previousYearTotalSales) / previousYearTotalSales) * 100
    : 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <TrendingUp className="h-4 w-4 text-emerald-600 mr-2" />
          <h2 className="text-sm font-semibold text-slate-800">매출/매입 추이</h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-slate-500">올해 매출:</span>
            <span className="font-semibold text-blue-600">
              {currentYearTotalSales >= 100000000
                ? `${(currentYearTotalSales / 100000000).toFixed(1)}억`
                : `${(currentYearTotalSales / 10000).toFixed(0)}만`}
            </span>
          </div>
          <div className={`px-1.5 py-0.5 rounded ${
            salesGrowth >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {salesGrowth >= 0 ? "+" : ""}{salesGrowth.toFixed(1)}% YoY
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
