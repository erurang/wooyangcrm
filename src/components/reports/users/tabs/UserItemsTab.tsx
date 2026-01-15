"use client";

import { Search, BarChart } from "lucide-react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface FilteredItem {
  name: string;
  spec?: string;
  quantity: string | number;
  type: "sales" | "purchase";
  total: number;
}

interface ItemChartData {
  name: string;
  value: number;
  type: "sales" | "purchase";
}

interface UserItemsTabProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedItemCategory: "all" | "sales" | "purchase";
  setSelectedItemCategory: (category: "all" | "sales" | "purchase") => void;
  filteredItems: FilteredItem[];
  itemsChartData: {
    salesData: ItemChartData[];
    purchaseData: ItemChartData[];
  };
}

export default function UserItemsTab({
  searchTerm,
  setSearchTerm,
  selectedItemCategory,
  setSelectedItemCategory,
  filteredItems,
  itemsChartData,
}: UserItemsTabProps) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-indigo-50 p-2 rounded-md mr-3">
            <Search className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">품목 검색</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="품목명 또는 규격 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedItemCategory}
            onChange={(e) =>
              setSelectedItemCategory(
                e.target.value as "all" | "sales" | "purchase"
              )
            }
            className="border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">전체 품목</option>
            <option value="sales">매출 품목</option>
            <option value="purchase">매입 품목</option>
          </select>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="overflow-y-auto max-h-[500px]">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                품목명
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                규격
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                수량
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                유형
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                금액
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-700">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                    {item.spec || "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.type === "sales"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {item.type === "sales" ? "매출" : "매입"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-indigo-600">
                    {item.total.toLocaleString()} 원
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 품목별 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        {/* 매출 품목 TOP 10 */}
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

        {/* 매입 품목 TOP 10 */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-50 p-2 rounded-md mr-3">
              <BarChart className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">
              품목별 매입 TOP 10
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
                categories: itemsChartData.purchaseData.map(
                  (item) => item.name
                ),
                labels: {
                  formatter: (val: string) => Number(val).toLocaleString(),
                },
              },
              colors: ["#10b981"],
              tooltip: {
                y: {
                  formatter: (value: number) => value.toLocaleString() + " 원",
                },
              },
            }}
            series={[
              {
                name: "매입액",
                data: itemsChartData.purchaseData.map((item) => item.value),
              },
            ]}
            type="bar"
            height={350}
          />
        </div>
      </div>
    </div>
  );
}
