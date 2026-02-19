"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { PieChart, BarChart, Users, Calendar, ChevronRight } from "lucide-react";
import { formatPeriodLabel } from "@/utils/dashboard-helpers";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ChartDataItem {
  name: string;
  value: number;
}

interface ChartData {
  labels: string[];
  data: number[];
}

interface AggregatedCompany {
  name: string;
  total: number;
}

type TransactionType = "sales" | "purchase";
type DateFilterType = "year" | "quarter" | "month";

interface TransactionTabProps {
  type: TransactionType;
  chartData: ChartData;
  itemsData: ChartDataItem[];
  companies: AggregatedCompany[];
  dateFilter: DateFilterType;
  selectedYear: number;
  selectedQuarter: number;
  selectedMonth: number;
}

// 타입별 설정
const CONFIG = {
  sales: {
    label: "매출",
    seriesName: "매출액",
    pieColors: [
      "#3b82f6",
      "#60a5fa",
      "#93c5fd",
      "#bfdbfe",
      "#dbeafe",
      "#eff6ff",
    ],
    barColor: "#4f46e5",
  },
  purchase: {
    label: "매입",
    seriesName: "매입액",
    pieColors: [
      "#10b981",
      "#34d399",
      "#6ee7b7",
      "#a7f3d0",
      "#d1fae5",
      "#ecfdf5",
    ],
    barColor: "#10b981",
  },
};

export default function TransactionTab({
  type,
  chartData,
  itemsData,
  companies,
  dateFilter,
  selectedYear,
  selectedQuarter,
  selectedMonth,
}: TransactionTabProps) {
  const router = useRouter();
  const config = CONFIG[type];
  const periodLabel = formatPeriodLabel(dateFilter, selectedYear, selectedQuarter, selectedMonth);

  // 거래처 클릭 시 상세 페이지로 이동
  const handleCompanyClick = (companyName: string) => {
    router.push(`/companies?search=${encodeURIComponent(companyName)}`);
  };

  return (
    <div className="mx-5 mb-5">
      {/* 헤더 - 기간 표시 */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 mb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">
            {config.label} 분석
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md">
            <Calendar className="h-4 w-4" />
            <span>{periodLabel}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 거래처별 비중 */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center mb-4">
            <div className="bg-sky-50 p-2 rounded-md mr-3">
              <PieChart className="h-5 w-5 text-sky-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">
              거래처별 {config.label} 비중
            </h2>
          </div>

        <ReactApexChart
          options={{
            labels: chartData.labels,
            legend: { position: "bottom" },
            colors: config.pieColors,
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
          series={chartData.data}
          type="pie"
          height={300}
        />
      </div>

      {/* 아이템별 차트 */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
        <div className="flex items-center mb-4">
          <div className="bg-sky-50 p-2 rounded-md mr-3">
            <BarChart className="h-5 w-5 text-sky-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">
            품목별 {config.label} TOP 10
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
              formatter: (val) => val.toLocaleString() + " 원",
              offsetX: 30,
              style: {
                fontSize: "12px",
                colors: ["#304758"],
              },
            },
            xaxis: {
              categories: itemsData.map((item) => item.name),
              labels: {
                formatter: (val) => val.toLocaleString(),
              },
            },
            colors: [config.barColor],
            tooltip: {
              y: {
                formatter: (value) => value.toLocaleString() + " 원",
              },
            },
          }}
          series={[
            {
              name: config.seriesName,
              data: itemsData.map((item) => item.value),
            },
          ]}
          type="bar"
          height={350}
        />
      </div>

      {/* 거래처 목록 */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
        <div className="flex items-center mb-4">
          <div className="bg-sky-50 p-2 rounded-md mr-3">
            <Users className="h-5 w-5 text-sky-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">
            {config.label} 거래처
          </h2>
        </div>

        {companies.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {companies.map((c) => (
              <div
                key={c.name}
                onClick={() => handleCompanyClick(c.name)}
                className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800 group-hover:text-sky-600 transition-colors">{c.name}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="font-semibold text-sky-600 bg-sky-50 px-3 py-1 rounded-md">
                  {c.total.toLocaleString()} 원
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <div className="bg-sky-50 p-3 rounded-full mb-2">
              <Users className="h-6 w-6 text-sky-400" />
            </div>
            <p>{config.label} 거래처가 없습니다</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
