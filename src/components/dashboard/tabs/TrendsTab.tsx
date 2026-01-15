"use client";

import dynamic from "next/dynamic";
import { TrendingUp, ArrowUpRight, Calendar } from "lucide-react";
import { formatPeriodLabel } from "@/utils/dashboard-helpers";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface MonthlyTrendData {
  months: string[];
  salesData: number[];
  purchaseData: number[];
}

type DateFilterType = "year" | "quarter" | "month";

interface TrendsTabProps {
  monthlyTrendData: MonthlyTrendData;
  dateFilter: DateFilterType;
  selectedYear: number;
  selectedQuarter: number;
  selectedMonth: number;
}

export default function TrendsTab({
  monthlyTrendData,
  dateFilter,
  selectedYear,
  selectedQuarter,
  selectedMonth,
}: TrendsTabProps) {
  const periodLabel = formatPeriodLabel(dateFilter, selectedYear, selectedQuarter, selectedMonth);

  return (
    <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-indigo-50 p-2 rounded-md mr-3">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">
            월별 매출/매입 추이
          </h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md">
          <Calendar className="h-4 w-4" />
          <span>{periodLabel}</span>
        </div>
      </div>

      <div className="mb-6">
        <ReactApexChart
          options={{
            chart: {
              type: "line",
              fontFamily: "Inter, sans-serif",
              toolbar: { show: false },
              zoom: { enabled: false },
            },
            stroke: {
              width: [3, 3],
              curve: "smooth",
            },
            markers: {
              size: 4,
              hover: {
                size: 6,
              },
            },
            xaxis: {
              categories: monthlyTrendData.months,
            },
            yaxis: {
              labels: {
                formatter: (value) => value.toLocaleString(),
              },
            },
            tooltip: {
              y: {
                formatter: (value) => value.toLocaleString() + " 원",
              },
            },
            colors: ["#4f46e5", "#10b981"],
            legend: {
              position: "top",
            },
          }}
          series={[
            {
              name: "매출",
              data: monthlyTrendData.salesData,
            },
            {
              name: "매입",
              data: monthlyTrendData.purchaseData,
            },
          ]}
          type="line"
          height={400}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-slate-800">매출 추이</h3>
            {monthlyTrendData.salesData.length > 0 &&
            monthlyTrendData.salesData[monthlyTrendData.salesData.length - 1] >
              0 ? (
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
            ) : (
              <span className="text-slate-400">-</span>
            )}
          </div>
          <p className="text-3xl font-bold text-indigo-600 mb-2">
            {monthlyTrendData.salesData.length > 0
              ? monthlyTrendData.salesData[
                  monthlyTrendData.salesData.length - 1
                ]?.toLocaleString() + " 원"
              : "데이터 없음"}
          </p>
          <p className="text-sm text-slate-500">
            {monthlyTrendData.salesData.length > 1
              ? "이전 기간 대비 변동 있음"
              : "비교 데이터 없음"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-slate-800">매입 추이</h3>
            {monthlyTrendData.purchaseData.length > 0 &&
            monthlyTrendData.purchaseData[
              monthlyTrendData.purchaseData.length - 1
            ] > 0 ? (
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
            ) : (
              <span className="text-slate-400">-</span>
            )}
          </div>
          <p className="text-3xl font-bold text-indigo-600 mb-2">
            {monthlyTrendData.purchaseData.length > 0
              ? monthlyTrendData.purchaseData[
                  monthlyTrendData.purchaseData.length - 1
                ]?.toLocaleString() + " 원"
              : "데이터 없음"}
          </p>
          <p className="text-sm text-slate-500">
            {monthlyTrendData.purchaseData.length > 1
              ? "이전 기간 대비 변동 있음"
              : "비교 데이터 없음"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-slate-800">이익률</h3>
            <span className="text-slate-400">-</span>
          </div>
          {monthlyTrendData.salesData.length > 0 &&
          monthlyTrendData.purchaseData.length > 0 &&
          monthlyTrendData.salesData[monthlyTrendData.salesData.length - 1] >
            0 ? (
            <p className="text-3xl font-bold text-indigo-600 mb-2">
              {Math.round(
                (1 -
                  monthlyTrendData.purchaseData[
                    monthlyTrendData.purchaseData.length - 1
                  ] /
                    monthlyTrendData.salesData[
                      monthlyTrendData.salesData.length - 1
                    ]) *
                  100
              )}
              %
            </p>
          ) : (
            <p className="text-3xl font-bold text-indigo-600 mb-2">
              데이터 없음
            </p>
          )}
          <p className="text-sm text-slate-500">매출 대비 매입 비율 기준</p>
        </div>
      </div>
    </div>
  );
}
