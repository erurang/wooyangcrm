"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

interface TrendComparisonChartProps {
  title: string;
  currentYearData: number[];
  previousYearData: number[];
  categories: string[];
  currentYearLabel?: string;
  previousYearLabel?: string;
  valueFormatter?: (value: number) => string;
  height?: number;
  showGrowth?: boolean;
  color?: string; // 기본 색상 (올해 데이터용, 전년은 회색 계열)
}

/**
 * 연도별 트렌드 비교 차트
 * - 전년 동기 대비 비교
 * - 성장률 표시 옵션
 *
 * @example
 * <TrendComparisonChart
 *   title="월별 매출 추이"
 *   currentYearData={[100, 120, 130, ...]}
 *   previousYearData={[90, 100, 110, ...]}
 *   categories={["1월", "2월", "3월", ...]}
 *   showGrowth={true}
 * />
 */
// 색상에서 연한 버전 생성 (전년도 데이터용)
const colorPairs: Record<string, string> = {
  "#4f46e5": "#a5b4fc", // indigo
  "#3b82f6": "#93c5fd", // blue
  "#10b981": "#6ee7b7", // emerald/green
  "#ef4444": "#fca5a5", // red
  "#f59e0b": "#fcd34d", // amber
};

export default function TrendComparisonChart({
  title,
  currentYearData,
  previousYearData,
  categories,
  currentYearLabel = "올해",
  previousYearLabel = "전년",
  valueFormatter = (v) => v.toLocaleString(),
  height = 350,
  showGrowth = false,
  color = "#4f46e5", // 기본 indigo
}: TrendComparisonChartProps) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  // 전년도용 연한 색상 결정
  const lightColor = colorPairs[color] || "#94a3b8";

  // 성장률 계산
  const growthRates = currentYearData.map((curr, idx) => {
    const prev = previousYearData[idx] || 0;
    if (prev === 0) return 0;
    return Math.round(((curr - prev) / prev) * 100);
  });

  const chartOptions: ApexOptions = {
    chart: {
      type: chartType,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    stroke: {
      curve: chartType === "area" ? "smooth" : "straight",
      width: chartType === "area" ? 2 : 0,
    },
    fill: {
      type: chartType === "area" ? "gradient" : "solid",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories,
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: valueFormatter,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: valueFormatter,
      },
    },
    colors: [color, lightColor],
    legend: {
      position: "top",
      horizontalAlign: "right",
    },
    plotOptions: {
      bar: {
        columnWidth: "50%",
        borderRadius: 4,
      },
    },
  };

  const series = [
    {
      name: currentYearLabel,
      data: currentYearData,
    },
    {
      name: previousYearLabel,
      data: previousYearData,
    },
  ];

  // 총합 및 성장률 계산
  const currentTotal = currentYearData.reduce((a, b) => a + b, 0);
  const previousTotal = previousYearData.reduce((a, b) => a + b, 0);
  const totalGrowth = previousTotal > 0 ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {showGrowth && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">
                총 {valueFormatter(currentTotal)}
              </span>
              <span
                className={`text-xs font-medium ${
                  totalGrowth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalGrowth >= 0 ? "+" : ""}
                {totalGrowth}% vs 전년
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setChartType("area")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              chartType === "area"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            영역
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              chartType === "bar"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            막대
          </button>
        </div>
      </div>

      {/* 차트 */}
      <ReactApexChart
        type={chartType}
        series={series}
        options={chartOptions}
        height={height}
      />

      {/* 성장률 표시 */}
      {showGrowth && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-2">월별 성장률</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat, idx) => (
              <div
                key={cat}
                className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded text-xs"
              >
                <span className="text-slate-600">{cat}</span>
                <span
                  className={`font-medium ${
                    growthRates[idx] >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {growthRates[idx] >= 0 ? "+" : ""}
                  {growthRates[idx]}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
