"use client";

import { TrendingUp, ArrowUpRight } from "lucide-react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface MonthlyTrendData {
  months: string[];
  salesData: number[];
  purchaseData: number[];
}

interface UserTrendsTabProps {
  monthlyTrendData: MonthlyTrendData;
}

export default function UserTrendsTab({
  monthlyTrendData,
}: UserTrendsTabProps) {
  const lastSalesValue =
    monthlyTrendData.salesData.length > 0
      ? monthlyTrendData.salesData[monthlyTrendData.salesData.length - 1]
      : 0;
  const lastPurchaseValue =
    monthlyTrendData.purchaseData.length > 0
      ? monthlyTrendData.purchaseData[monthlyTrendData.purchaseData.length - 1]
      : 0;

  const profitRate =
    lastSalesValue > 0
      ? Math.round((1 - lastPurchaseValue / lastSalesValue) * 100)
      : 0;

  return (
    <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
      <div className="flex items-center mb-6">
        <div className="bg-indigo-50 p-2 rounded-md mr-3">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">
          월별 매출/매입 추이
        </h2>
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
                formatter: (value: number) => value.toLocaleString(),
              },
            },
            tooltip: {
              y: {
                formatter: (value: number) => value.toLocaleString() + " 원",
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
            {lastSalesValue > 0 ? (
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
            ) : (
              <span className="text-slate-400">-</span>
            )}
          </div>
          <p className="text-3xl font-bold text-indigo-600 mb-2">
            {lastSalesValue > 0
              ? lastSalesValue.toLocaleString() + " 원"
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
            {lastPurchaseValue > 0 ? (
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
            ) : (
              <span className="text-slate-400">-</span>
            )}
          </div>
          <p className="text-3xl font-bold text-indigo-600 mb-2">
            {lastPurchaseValue > 0
              ? lastPurchaseValue.toLocaleString() + " 원"
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
          <p className="text-3xl font-bold text-indigo-600 mb-2">
            {lastSalesValue > 0 ? `${profitRate}%` : "데이터 없음"}
          </p>
          <p className="text-sm text-slate-500">매출 대비 매입 비율 기준</p>
        </div>
      </div>
    </div>
  );
}
