"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Building, Users, PieChart, ArrowUpDown, ArrowUp, ArrowDown, Calendar, ExternalLink, Download } from "lucide-react";
import { formatPeriodLabel } from "@/utils/dashboard-helpers";
import { exportClientsToExcel } from "@/utils/exportToExcel";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type SortColumn = "name" | "consultations" | "estimates" | "orders" | "totalSales" | "totalPurchases";
type SortDirection = "asc" | "desc";
type DateFilterType = "year" | "quarter" | "month";

interface ClientAnalysisItem {
  id: string;
  name: string;
  consultations: number;
  estimates: number;
  orders: number;
  totalSales: number;
  totalPurchases: number;
}

interface ClientsTabProps {
  clientAnalysisData: ClientAnalysisItem[] | any[];
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
  align?: "left" | "center" | "right";
}) {
  const isActive = currentSort === column;
  return (
    <th
      className={`px-4 py-3 text-${align} text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none`}
      onClick={() => onSort(column)}
    >
      <span className={`inline-flex items-center gap-1 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : ""}`}>
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

export default function ClientsTab({
  clientAnalysisData,
  dateFilter,
  selectedYear,
  selectedQuarter,
  selectedMonth,
}: ClientsTabProps) {
  const router = useRouter();
  const [sortColumn, setSortColumn] = useState<SortColumn | null>("totalSales");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const periodLabel = formatPeriodLabel(dateFilter, selectedYear, selectedQuarter, selectedMonth);

  // 거래처 클릭 시 상담 내역 페이지로 이동
  const handleCompanyClick = (companyId: string) => {
    router.push(`/consultations/${companyId}`);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const sortedClients = useMemo(() => {
    if (!sortColumn) return clientAnalysisData;

    return [...clientAnalysisData].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortColumn) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "consultations":
          aVal = a.consultations;
          bVal = b.consultations;
          break;
        case "estimates":
          aVal = a.estimates;
          bVal = b.estimates;
          break;
        case "orders":
          aVal = a.orders;
          bVal = b.orders;
          break;
        case "totalSales":
          aVal = a.totalSales;
          bVal = b.totalSales;
          break;
        case "totalPurchases":
          aVal = a.totalPurchases;
          bVal = b.totalPurchases;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [clientAnalysisData, sortColumn, sortDirection]);

  return (
    <div className="bg-white border border-slate-200 shadow-sm p-5 mx-5 mb-5 rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-sky-50 p-2 rounded-md mr-3">
            <Building className="h-5 w-5 text-sky-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">거래처 분석</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md">
            <Calendar className="h-4 w-4" />
            <span>{periodLabel}</span>
          </div>
          <button
            onClick={() => exportClientsToExcel(sortedClients, periodLabel)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors"
            title="Excel로 내보내기"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">내보내기</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <SortableHeader
                label="거래처명"
                column="name"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="상담 횟수"
                column="consultations"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="center"
              />
              <SortableHeader
                label="견적 건수"
                column="estimates"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="center"
              />
              <SortableHeader
                label="발주 건수"
                column="orders"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="center"
              />
              <SortableHeader
                label="매출액"
                column="totalSales"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="right"
              />
              <SortableHeader
                label="매입액"
                column="totalPurchases"
                currentSort={sortColumn}
                currentDirection={sortDirection}
                onSort={handleSort}
                align="right"
              />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {sortedClients.length > 0 ? (
              sortedClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => handleCompanyClick(client.id)}
                    className="hover:bg-sky-50/50 cursor-pointer group"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-700 group-hover:text-sky-600 transition-colors">
                      <div className="flex items-center gap-1">
                        {client.name}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
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
                categories: clientAnalysisData
                  .sort((a, b) => b.consultations - a.consultations)
                  .slice(0, 5)
                  .map((client) => client.name),
              },
              colors: ["#4f46e5"],
              tooltip: {
                y: {
                  formatter: (value) => value + " 회",
                },
              },
            }}
            series={[
              {
                name: "상담 횟수",
                data: clientAnalysisData
                  .sort((a, b) => b.consultations - a.consultations)
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
              labels: clientAnalysisData
                .sort((a, b) => b.totalSales - a.totalSales)
                .slice(0, 5)
                .map((client) => client.name),
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
                  formatter: (value) => value.toLocaleString() + " 원",
                },
              },
            }}
            series={clientAnalysisData
              .sort((a, b) => b.totalSales - a.totalSales)
              .slice(0, 5)
              .map((client) => client.totalSales)}
            type="donut"
            height={300}
          />
        </div>
      </div>
    </div>
  );
}
