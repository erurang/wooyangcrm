"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import dynamic from "next/dynamic";
import {
  Search,
  Users,
  CheckCircle,
  Clock,
  Package,
  FileText,
  Medal,
  ArrowUpDown,
  TrendingUp,
  Target,
} from "lucide-react";
import type {
  DateFilterType,
  ProductionPerformanceResponse,
  ProductionUserPerformance,
} from "@/types/reports";

// ApexCharts 동적 로드 (SSR 비활성화)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ProductionPerformanceTabProps {
  year: number;
  dateFilter: DateFilterType;
  quarter?: number;
  month?: number;
}

type SortField =
  | "completed_count"
  | "on_time_rate"
  | "avg_processing_days"
  | "inventory_completed"
  | "production_records";
type SortDirection = "asc" | "desc";

export default function ProductionPerformanceTab({
  year,
  dateFilter,
  quarter,
  month,
}: ProductionPerformanceTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("completed_count");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // API 호출
  const fetchProductionPerformance = async (): Promise<ProductionPerformanceResponse> => {
    const params = new URLSearchParams({ year: String(year) });
    if (dateFilter === "quarter" && quarter) {
      params.append("quarter", String(quarter));
    } else if (dateFilter === "month" && month) {
      params.append("month", String(month));
    }

    const response = await fetch(`/api/reports/production-performance?${params}`);
    if (!response.ok) {
      throw new Error("Failed to fetch production performance");
    }
    return response.json();
  };

  const { data, isLoading } = useSWR(
    `production-performance-${year}-${dateFilter}-${quarter}-${month}`,
    fetchProductionPerformance,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  // 검색 및 정렬
  const filteredAndSortedUsers = useMemo(() => {
    let result = data?.by_user || [];

    if (searchQuery) {
      result = result.filter(
        (u) =>
          u.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.position.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    result = [...result].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      // avg_processing_days는 낮을수록 좋음
      if (sortField === "avg_processing_days") {
        return sortDirection === "desc" ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
    });

    return result.map((u, i) => ({ ...u, rank: i + 1 }));
  }, [data?.by_user, searchQuery, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // 월별 추이 차트 옵션
  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 100],
      },
    },
    xaxis: {
      categories: data?.monthly_trend?.map((t) => {
        const [, m] = t.month.split("-");
        return `${parseInt(m)}월`;
      }) || [],
      labels: { style: { fontSize: "11px", colors: "#64748b" } },
    },
    yaxis: {
      labels: { style: { fontSize: "11px", colors: "#64748b" } },
    },
    colors: ["#3b82f6", "#10b981"],
    legend: { position: "top", horizontalAlign: "right" },
    tooltip: {
      y: { formatter: (val: number) => `${val}건` },
    },
  };

  const chartSeries = [
    {
      name: "완료 건수",
      data: data?.monthly_trend?.map((t) => t.completed) || [],
    },
    {
      name: "납기 준수",
      data: data?.monthly_trend?.map((t) => t.on_time) || [],
    },
  ];

  // 납기준수율 게이지 옵션
  const gaugeOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "radialBar",
      fontFamily: "inherit",
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: { size: "65%" },
        track: { background: "#e2e8f0" },
        dataLabels: {
          name: { fontSize: "14px", color: "#64748b", offsetY: 60 },
          value: {
            fontSize: "28px",
            fontWeight: "bold",
            color: "#1e293b",
            offsetY: 0,
            formatter: (val: number) => `${val}%`,
          },
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: ["#10b981"],
        stops: [0, 100],
      },
    },
    colors: ["#3b82f6"],
    labels: ["납기 준수율"],
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
          <div className="h-10 bg-slate-200 rounded w-64 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            <CheckCircle className="h-3.5 w-3.5 mr-1 text-sky-500" />
            작업 완료
          </div>
          <p className="text-2xl font-bold text-sky-600">
            {summary?.total_completed?.toLocaleString() || 0}건
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            <Target className="h-3.5 w-3.5 mr-1 text-emerald-500" />
            납기 준수율
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {summary?.on_time_rate || 0}%
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            <Clock className="h-3.5 w-3.5 mr-1 text-amber-500" />
            평균 처리
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {summary?.avg_processing_days || 0}일
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            <Package className="h-3.5 w-3.5 mr-1 text-sky-500" />
            입출고 처리
          </div>
          <p className="text-2xl font-bold text-sky-600">
            {summary?.inventory_tasks_completed?.toLocaleString() || 0}건
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            <FileText className="h-3.5 w-3.5 mr-1 text-purple-500" />
            생산 기록
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {summary?.production_records_count?.toLocaleString() || 0}건
          </p>
        </div>
      </div>

      {/* 차트 영역 */}
      {dateFilter === "year" && (data?.monthly_trend?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 월별 추이 차트 */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-slate-500" />
              <h3 className="font-medium text-slate-700">월별 작업 완료 추이</h3>
            </div>
            <Chart
              options={chartOptions}
              series={chartSeries}
              type="area"
              height={280}
            />
          </div>

          {/* 납기준수율 게이지 */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-slate-500" />
              <h3 className="font-medium text-slate-700">납기 준수율</h3>
            </div>
            <Chart
              options={gaugeOptions}
              series={[summary?.on_time_rate || 0]}
              type="radialBar"
              height={280}
            />
          </div>
        </div>
      )}

      {/* 담당자별 테이블 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="담당자 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-500">
                총 {filteredAndSortedUsers.length}명 활동
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-12">
                  순위
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  담당자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  직급
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort("completed_count")}
                >
                  <div className="flex items-center justify-center gap-1">
                    작업완료
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort("on_time_rate")}
                >
                  <div className="flex items-center justify-center gap-1">
                    납기준수
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort("avg_processing_days")}
                >
                  <div className="flex items-center justify-center gap-1">
                    평균처리
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort("inventory_completed")}
                >
                  <div className="flex items-center justify-center gap-1">
                    입출고
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort("production_records")}
                >
                  <div className="flex items-center justify-center gap-1">
                    생산기록
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    활동 내역이 없습니다
                  </td>
                </tr>
              ) : (
                filteredAndSortedUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {user.rank && user.rank <= 3 ? (
                        <Medal
                          className={`h-5 w-5 ${
                            user.rank === 1
                              ? "text-yellow-500"
                              : user.rank === 2
                              ? "text-slate-400"
                              : "text-amber-600"
                          }`}
                        />
                      ) : (
                        <span className="text-slate-500 font-medium">
                          {user.rank}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {user.user_name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {user.position || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-sky-600 font-medium">
                        <CheckCircle className="h-3 w-3" />
                        {user.completed_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          user.on_time_rate >= 90
                            ? "text-emerald-600"
                            : user.on_time_rate >= 70
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {user.on_time_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          user.avg_processing_days <= 2
                            ? "text-emerald-600"
                            : user.avg_processing_days <= 5
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        {user.avg_processing_days}일
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-sky-600">
                        <Package className="h-3 w-3" />
                        {user.inventory_completed}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-purple-600">
                        <FileText className="h-3 w-3" />
                        {user.production_records}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
