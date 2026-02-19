"use client";

import dynamic from "next/dynamic";
import { Package, TrendingUp, BarChart } from "lucide-react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface AnalyticsTabProps {
  topProducts: any[];
  trendMonths: string[];
  trendData: number[];
  confirmedSales: number;
  confirmedPurchases: number;
  pendingSales: number;
  pendingPurchases: number;
  canceledSales: number;
  canceledPurchases: number;
  totalSales: number;
  totalPurchases: number;
}

export default function AnalyticsTab({
  topProducts,
  trendMonths,
  trendData,
  confirmedSales,
  confirmedPurchases,
  pendingSales,
  pendingPurchases,
  canceledSales,
  canceledPurchases,
  totalSales,
  totalPurchases,
}: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      {/* Top Products */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <div className="flex items-center mb-6">
          <Package className="h-5 w-5 text-sky-600 mr-2" />
          <h2 className="text-lg font-semibold text-slate-800">
            인기 품목 TOP 5
          </h2>
        </div>

        {topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    품목명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    규격
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    거래 횟수
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    총 금액
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {topProducts.map((product: any, index: number) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center justify-center w-6 h-6 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {product.spec || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-700">
                      {product.count}회
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-sky-600">
                      {product.amount.toLocaleString()} 원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">품목 데이터가 없습니다</p>
          </div>
        )}
      </div>

      {/* Consultation Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <div className="flex items-center mb-6">
          <TrendingUp className="h-5 w-5 text-sky-600 mr-2" />
          <h2 className="text-lg font-semibold text-slate-800">상담 추이</h2>
        </div>

        {trendMonths.length > 0 ? (
          <div className="h-80">
            <ReactApexChart
              options={{
                chart: {
                  type: "line",
                  fontFamily: "Inter, sans-serif",
                  toolbar: { show: false },
                },
                xaxis: {
                  categories: trendMonths.map((month) => {
                    const [year, monthNum] = month.split("-");
                    return `${year}.${monthNum}`;
                  }),
                },
                stroke: { curve: "smooth", width: 3 },
                colors: ["#4f46e5"],
                markers: { size: 5 },
                tooltip: {
                  y: { formatter: (val: number) => val + "건" },
                },
              }}
              series={[{ name: "상담 건수", data: trendData }]}
              type="line"
              height="100%"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">상담 데이터가 없습니다</p>
          </div>
        )}
      </div>

      {/* Sales vs Purchase Comparison */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
        <div className="flex items-center mb-6">
          <BarChart className="h-5 w-5 text-sky-600 mr-2" />
          <h2 className="text-lg font-semibold text-slate-800">
            매출/매입 비교
          </h2>
        </div>

        <div className="h-80">
          <ReactApexChart
            options={{
              chart: {
                type: "bar",
                fontFamily: "Inter, sans-serif",
                toolbar: { show: false },
              },
              plotOptions: {
                bar: {
                  horizontal: false,
                  columnWidth: "55%",
                  borderRadius: 4,
                },
              },
              dataLabels: { enabled: false },
              xaxis: { categories: ["확정", "진행 중", "취소", "총계"] },
              colors: ["#4f46e5", "#10b981"],
              legend: { position: "top" },
              tooltip: {
                y: { formatter: (val: number) => val.toLocaleString() + " 원" },
              },
            }}
            series={[
              {
                name: "매출",
                data: [confirmedSales, pendingSales, canceledSales, totalSales],
              },
              {
                name: "매입",
                data: [
                  confirmedPurchases,
                  pendingPurchases,
                  canceledPurchases,
                  totalPurchases,
                ],
              },
            ]}
            type="bar"
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
