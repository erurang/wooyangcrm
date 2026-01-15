"use client";

import { PieChart, BarChart, BarChart3, Users } from "lucide-react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface Company {
  name: string;
  total: number;
}

interface ChartData {
  labels: string[];
  data: number[];
}

interface ItemChartData {
  name: string;
  value: number;
  type: "sales" | "purchase";
}

interface SalesSummaryData {
  estimates?: {
    pending?: number;
    completed?: number;
    canceled?: number;
  };
}

interface UserSalesTabProps {
  salesChart: ChartData;
  itemsChartData: {
    salesData: ItemChartData[];
    purchaseData: ItemChartData[];
  };
  aggregatedSalesCompanies: Company[];
  salesSummary: Record<string, SalesSummaryData> | undefined;
  userId: string;
}

export default function UserSalesTab({
  salesChart,
  itemsChartData,
  aggregatedSalesCompanies,
  salesSummary,
  userId,
}: UserSalesTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mx-5 mb-5">
      {/* 거래처별 매출 비중 */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
        <div className="flex items-center mb-4">
          <div className="bg-indigo-50 p-2 rounded-md mr-3">
            <PieChart className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">
            거래처별 매출 비중
          </h2>
        </div>

        <ReactApexChart
          options={{
            labels: salesChart.labels,
            legend: { position: "bottom" },
            colors: [
              "#3b82f6",
              "#60a5fa",
              "#93c5fd",
              "#bfdbfe",
              "#dbeafe",
              "#eff6ff",
            ],
            chart: {
              fontFamily: "Inter, sans-serif",
            },
            dataLabels: {
              enabled: true,
              formatter: (val: number) => val.toFixed(1) + "%",
            },
            tooltip: {
              y: {
                formatter: (value: number) => value.toLocaleString() + " 원",
              },
            },
          }}
          series={salesChart.data}
          type="pie"
          height={300}
        />
      </div>

      {/* 아이템별 매출 차트 */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
        <div className="flex items-center mb-4">
          <div className="bg-indigo-50 p-2 rounded-md mr-3">
            <BarChart className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">
            품목별 매출 TOP 10
          </h2>
        </div>

        <ReactApexChart
          options={{
            chart: {
              type: "bar",
              fontFamily: "Inter, sans-serif",
              toolbar: { show: false },
            },
            plotOptions: {
              bar: {
                horizontal: true,
                borderRadius: 4,
                dataLabels: {
                  position: "top",
                },
              },
            },
            dataLabels: {
              enabled: true,
              formatter: (val: number) => val.toLocaleString() + " 원",
              offsetX: 30,
              style: {
                fontSize: "12px",
                colors: ["#304758"],
              },
            },
            xaxis: {
              categories: itemsChartData.salesData.map((item) => item.name),
              labels: {
                formatter: (val: string) => Number(val).toLocaleString(),
              },
            },
            colors: ["#4f46e5"],
            tooltip: {
              y: {
                formatter: (value: number) => value.toLocaleString() + " 원",
              },
            },
          }}
          series={[
            {
              name: "매출액",
              data: itemsChartData.salesData.map((item) => item.value),
            },
          ]}
          type="bar"
          height={350}
        />
      </div>

      {/* 견적 금액 (Area Chart) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
        <div className="flex items-center mb-4">
          <div className="bg-indigo-50 p-2 rounded-md mr-3">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">견적 금액</h2>
        </div>

        <ReactApexChart
          options={{
            chart: {
              type: "area",
              fontFamily: "Inter, sans-serif",
              toolbar: { show: false },
            },
            xaxis: {
              categories: ["진행 중", "완료", "취소"],
            },
            yaxis: {
              labels: {
                formatter: (value: number) => value.toLocaleString(),
              },
            },
            stroke: {
              curve: "smooth",
              width: 3,
            },
            fill: {
              type: "gradient",
              gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.2,
                stops: [0, 90, 100],
              },
            },
            dataLabels: {
              enabled: true,
              formatter: (value: number) => value.toLocaleString(),
            },
            colors: ["#0ea5e9"],
          }}
          series={[
            {
              name: "견적 실적",
              data: [
                salesSummary?.[userId]?.estimates?.pending || 0,
                salesSummary?.[userId]?.estimates?.completed || 0,
                salesSummary?.[userId]?.estimates?.canceled || 0,
              ],
            },
          ]}
          type="area"
          height={300}
        />
      </div>

      {/* 매출 거래처 */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
        <div className="flex items-center mb-4">
          <div className="bg-indigo-50 p-2 rounded-md mr-3">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">매출 거래처</h2>
        </div>

        {aggregatedSalesCompanies.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {aggregatedSalesCompanies.map((c) => (
              <div
                key={c.name}
                className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
              >
                <span className="font-medium text-slate-800">{c.name}</span>
                <span className="font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-md">
                  {c.total.toLocaleString()} 원
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <div className="bg-indigo-50 p-3 rounded-full mb-2">
              <Users className="h-6 w-6 text-indigo-400" />
            </div>
            <p>매출 거래처가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
