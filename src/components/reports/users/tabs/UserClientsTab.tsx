"use client";

import { Building, Users, PieChart } from "lucide-react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ClientAnalysis {
  name: string;
  consultations: number;
  estimates: number;
  orders: number;
  totalSales: number;
  totalPurchases: number;
}

interface UserClientsTabProps {
  clientAnalysisData: ClientAnalysis[] | any[];
}

export default function UserClientsTab({
  clientAnalysisData,
}: UserClientsTabProps) {
  const sortedBySales = [...clientAnalysisData].sort(
    (a, b) => b.totalSales - a.totalSales
  );
  const sortedByConsultations = [...clientAnalysisData].sort(
    (a, b) => b.consultations - a.consultations
  );

  return (
    <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
      <div className="flex items-center mb-6">
        <div className="bg-sky-50 p-2 rounded-md mr-3">
          <Building className="h-5 w-5 text-sky-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">거래처 분석</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                거래처명
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                상담 횟수
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                견적 건수
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                발주 건수
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                매출액
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                매입액
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {sortedBySales.length > 0 ? (
              sortedBySales.map((client, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-700">
                    {client.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-slate-500">
                    {client.consultations}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-slate-500">
                    {client.estimates}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-slate-500">
                    {client.orders}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-sky-600">
                    {client.totalSales.toLocaleString()} 원
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-emerald-600">
                    {client.totalPurchases.toLocaleString()} 원
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  거래처 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 거래처별 상담 빈도 */}
        <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-sky-50 p-2 rounded-md mr-3">
              <Users className="h-5 w-5 text-sky-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              거래처별 상담 빈도
            </h3>
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
                  horizontal: false,
                  columnWidth: "55%",
                  borderRadius: 4,
                },
              },
              dataLabels: {
                enabled: false,
              },
              xaxis: {
                categories: sortedByConsultations
                  .slice(0, 5)
                  .map((client) => client.name),
              },
              colors: ["#4f46e5"],
              tooltip: {
                y: {
                  formatter: (value: number) => value + " 회",
                },
              },
            }}
            series={[
              {
                name: "상담 횟수",
                data: sortedByConsultations
                  .slice(0, 5)
                  .map((client) => client.consultations),
              },
            ]}
            type="bar"
            height={300}
          />
        </div>

        {/* 거래처별 매출 비중 */}
        <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-sky-50 p-2 rounded-md mr-3">
              <PieChart className="h-5 w-5 text-sky-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              거래처별 매출 비중
            </h3>
          </div>

          <ReactApexChart
            options={{
              chart: {
                type: "donut",
                fontFamily: "Inter, sans-serif",
              },
              labels: sortedBySales.slice(0, 5).map((client) => client.name),
              colors: [
                "#3b82f6",
                "#60a5fa",
                "#93c5fd",
                "#bfdbfe",
                "#dbeafe",
              ],
              legend: {
                position: "bottom",
              },
              dataLabels: {
                enabled: false,
              },
              tooltip: {
                y: {
                  formatter: (value: number) => value.toLocaleString() + " 원",
                },
              },
            }}
            series={sortedBySales.slice(0, 5).map((client) => client.totalSales)}
            type="donut"
            height={300}
          />
        </div>
      </div>
    </div>
  );
}
