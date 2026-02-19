"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Search, BarChart, ArrowUpDown, ArrowUp, ArrowDown, Calendar, Download } from "lucide-react";
import { formatPeriodLabel } from "@/utils/dashboard-helpers";
import { exportItemsToExcel } from "@/utils/exportToExcel";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type ItemCategory = "all" | "sales" | "purchase";
type SortColumn = "name" | "spec" | "quantity" | "type" | "total";
type SortDirection = "asc" | "desc";
type DateFilterType = "year" | "quarter" | "month";

interface FilteredItem {
  name: string;
  spec?: string;
  quantity: string | number;
  type: "sales" | "purchase";
  total: number;
}

interface ChartDataItem {
  name: string;
  value: number;
}

interface ItemsChartData {
  salesData: ChartDataItem[];
  purchaseData: ChartDataItem[];
}

interface ItemsTabProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedItemCategory: ItemCategory;
  setSelectedItemCategory: (value: ItemCategory) => void;
  filteredItems: FilteredItem[];
  itemsChartData: ItemsChartData;
  dateFilter: DateFilterType;
  selectedYear: number;
  selectedQuarter: number;
  selectedMonth: number;
}

// 정렬 가능한 테이블 헤더
function SortableHeader({
  label,
  column,
  currentSort,
  currentDirection,
  onSort,
  align = "left",
}: {
  label: string;
  column: SortColumn;
  currentSort: SortColumn | null;
  currentDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  align?: "left" | "right";
}) {
  const isActive = currentSort === column;
  return (
    <th
      className={`px-4 py-3 text-${align} text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDirection === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </th>
  );
}

export default function ItemsTab({
  searchTerm,
  setSearchTerm,
  selectedItemCategory,
  setSelectedItemCategory,
  filteredItems,
  itemsChartData,
  dateFilter,
  selectedYear,
  selectedQuarter,
  selectedMonth,
}: ItemsTabProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>("total");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const periodLabel = formatPeriodLabel(dateFilter, selectedYear, selectedQuarter, selectedMonth);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const sortedItems = useMemo(() => {
    if (!sortColumn) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortColumn) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "spec":
          aVal = (a.spec || "").toLowerCase();
          bVal = (b.spec || "").toLowerCase();
          break;
        case "quantity":
          aVal = typeof a.quantity === "number" ? a.quantity : parseFloat(String(a.quantity)) || 0;
          bVal = typeof b.quantity === "number" ? b.quantity : parseFloat(String(b.quantity)) || 0;
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "total":
          aVal = a.total;
          bVal = b.total;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortColumn, sortDirection]);

  return (
    <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-sky-50 p-2 rounded-md mr-3">
            <Search className="h-5 w-5 text-sky-600" />
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
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <select
            value={selectedItemCategory}
            onChange={(e) => setSelectedItemCategory(e.target.value as ItemCategory)}
            className="border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">전체 품목</option>
            <option value="sales">매출 품목</option>
            <option value="purchase">매입 품목</option>
          </select>

          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md">
            <Calendar className="h-4 w-4" />
            <span>{periodLabel}</span>
          </div>

          <button
            onClick={() => exportItemsToExcel(sortedItems, periodLabel)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors"
            title="Excel로 내보내기"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">내보내기</span>
          </button>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="overflow-y-auto max-h-[500px]">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <SortableHeader
                label="품목명"
                column="name"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="규격"
                column="spec"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="수량"
                column="quantity"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="유형"
                column="type"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="금액"
                column="total"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="right"
              />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {sortedItems.length > 0 ? (
              sortedItems.map((item, index) => (
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
                          ? "bg-sky-100 text-sky-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {item.type === "sales" ? "매출" : "매입"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-sky-600">
                    {item.total.toLocaleString()} 원
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
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
            <div className="bg-sky-50 p-2 rounded-md mr-3">
              <BarChart className="h-5 w-5 text-sky-600" />
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
                formatter: (val) => val.toLocaleString() + " 원",
                offsetX: 30,
                style: {
                  fontSize: "12px",
                  colors: ["#304758"],
                },
              },
              xaxis: {
                categories: itemsChartData.salesData.map((item) => item.name),
                labels: {
                  formatter: (val) => val.toLocaleString(),
                },
              },
              colors: ["#4f46e5"],
              tooltip: {
                y: {
                  formatter: (value) => value.toLocaleString() + " 원",
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
            <div className="bg-sky-50 p-2 rounded-md mr-3">
              <BarChart className="h-5 w-5 text-sky-600" />
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
                formatter: (val) => val.toLocaleString() + " 원",
                offsetX: 30,
                style: {
                  fontSize: "12px",
                  colors: ["#304758"],
                },
              },
              xaxis: {
                categories: itemsChartData.purchaseData.map((item) => item.name),
                labels: {
                  formatter: (val) => val.toLocaleString(),
                },
              },
              colors: ["#10b981"],
              tooltip: {
                y: {
                  formatter: (value) => value.toLocaleString() + " 원",
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
