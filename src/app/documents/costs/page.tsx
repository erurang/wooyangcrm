"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Building2,
  FileText,
  ShoppingCart,
  Calendar,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { useDocumentCostSummary } from "@/hooks/documents/useDocumentCostSummary";
import type { CompanySummary } from "@/hooks/documents/useDocumentCostSummary";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

// 금액 포맷팅
function formatCurrency(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억`;
  }
  if (amount >= 10000) {
    return `${Math.round(amount / 10000).toLocaleString()}만`;
  }
  return amount.toLocaleString();
}

// 전체 금액 포맷팅
function formatFullCurrency(amount: number): string {
  return `${amount.toLocaleString()}원`;
}

export default function DocumentCostsDashboard() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  // 날짜 필터 상태
  const [dateFilter, setDateFilter] = useState<"year" | "quarter" | "month">("year");
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // 날짜 계산
  const { startDate, endDate, periodLabel } = useMemo(() => {
    let start: string;
    let end: string;
    let label: string;

    if (dateFilter === "year") {
      start = `${selectedYear}-01-01`;
      end = `${selectedYear}-12-31`;
      label = `${selectedYear}년`;
    } else if (dateFilter === "quarter") {
      const startMonth = (selectedQuarter - 1) * 3 + 1;
      const endMonth = selectedQuarter * 3;
      start = `${selectedYear}-${String(startMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(selectedYear, endMonth, 0).getDate();
      end = `${selectedYear}-${String(endMonth).padStart(2, "0")}-${lastDay}`;
      label = `${selectedYear}년 ${selectedQuarter}분기`;
    } else {
      start = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      end = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${lastDay}`;
      label = `${selectedYear}년 ${selectedMonth}월`;
    }

    return { startDate: start, endDate: end, periodLabel: label };
  }, [dateFilter, selectedYear, selectedQuarter, selectedMonth]);

  // 데이터 조회
  const {
    summary,
    typeStatusSummary,
    monthlySummary,
    companySummary,
    documentCounts,
    isLoading,
  } = useDocumentCostSummary({ startDate, endDate });

  // 월별 차트 데이터
  const chartOptions = useMemo(() => ({
    chart: {
      type: "bar" as const,
      stacked: false,
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: monthlySummary.map((m) => {
        const [, month] = m.month.split("-");
        return `${parseInt(month)}월`;
      }),
      labels: {
        style: { colors: "#64748b", fontSize: "12px" },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatCurrency(val),
        style: { colors: "#64748b", fontSize: "12px" },
      },
    },
    fill: { opacity: 1 },
    tooltip: {
      y: {
        formatter: (val: number) => formatFullCurrency(val),
      },
    },
    colors: ["#3b82f6", "#10b981"],
    legend: {
      position: "top" as const,
      horizontalAlign: "right" as const,
    },
  }), [monthlySummary]);

  const chartSeries = useMemo(() => [
    {
      name: "매출 (견적)",
      data: monthlySummary.map((m) => m.estimate),
    },
    {
      name: "매입 (발주)",
      data: monthlySummary.map((m) => m.order),
    },
  ], [monthlySummary]);

  // 타입별 상태 차트 데이터
  const statusChartOptions = useMemo(() => ({
    chart: {
      type: "donut" as const,
      fontFamily: "inherit",
    },
    labels: ["완료", "진행중", "취소", "만료"],
    colors: ["#10b981", "#3b82f6", "#ef4444", "#94a3b8"],
    legend: {
      position: "bottom" as const,
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(0)}%`,
    },
    tooltip: {
      y: {
        formatter: (val: number) => formatFullCurrency(val),
      },
    },
  }), []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">비용 현황을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-teal-600" />
              문서 비용 대시보드
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {periodLabel} 거래 현황
            </p>
          </div>

          {/* 필터 */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as "year" | "quarter" | "month")}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="year">연간</option>
              <option value="quarter">분기</option>
              <option value="month">월간</option>
            </select>
            {dateFilter === "quarter" && (
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {[1, 2, 3, 4].map((q) => (
                  <option key={q} value={q}>{q}분기</option>
                ))}
              </select>
            )}
            {dateFilter === "month" && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5"
        >
          <div className="flex items-center text-slate-500 text-xs mb-2">
            <TrendingUp className="w-4 h-4 mr-1 text-blue-500" />
            총 매출 (견적 완료)
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">
            {formatCurrency(summary.totalSales)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {formatFullCurrency(summary.totalSales)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5"
        >
          <div className="flex items-center text-slate-500 text-xs mb-2">
            <TrendingDown className="w-4 h-4 mr-1 text-emerald-500" />
            총 매입 (발주 완료)
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600">
            {formatCurrency(summary.totalPurchase)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {formatFullCurrency(summary.totalPurchase)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5"
        >
          <div className="flex items-center text-slate-500 text-xs mb-2">
            <Clock className="w-4 h-4 mr-1 text-amber-500" />
            진행중 금액
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-600">
            {formatCurrency(summary.totalPending)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {formatFullCurrency(summary.totalPending)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5"
        >
          <div className="flex items-center text-slate-500 text-xs mb-2">
            <BarChart3 className="w-4 h-4 mr-1 text-purple-500" />
            손익 (매출-매입)
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${summary.profit >= 0 ? "text-purple-600" : "text-red-600"}`}>
            {summary.profit >= 0 ? "+" : ""}{formatCurrency(summary.profit)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {summary.profit >= 0 ? "+" : ""}{formatFullCurrency(summary.profit)}
          </p>
        </motion.div>
      </div>

      {/* 문서 건수 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { type: "estimate", label: "견적서", icon: FileText, color: "blue" },
          { type: "order", label: "발주서", icon: ShoppingCart, color: "emerald" },
          { type: "requestQuote", label: "의뢰서", icon: Calendar, color: "purple" },
        ].map(({ type, label, icon: Icon, color }) => {
          const counts = documentCounts[type as keyof typeof documentCounts];
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 text-${color}-500`} />
                  <span className="font-medium text-slate-700">{label}</span>
                </div>
                <span className="text-lg font-bold text-slate-800">{counts.total}건</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-blue-600 font-medium">{counts.pending}</p>
                  <p className="text-slate-500">진행</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-green-600 font-medium">{counts.completed}</p>
                  <p className="text-slate-500">완료</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-red-600 font-medium">{counts.canceled}</p>
                  <p className="text-slate-500">취소</p>
                </div>
                <div className="bg-slate-100 rounded-lg p-2">
                  <p className="text-slate-600 font-medium">{counts.expired}</p>
                  <p className="text-slate-500">만료</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 월별 매출/매입 차트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5"
        >
          <h3 className="font-semibold text-slate-700 mb-4">월별 매출/매입 추이</h3>
          {monthlySummary.length > 0 ? (
            <ReactApexChart
              options={chartOptions}
              series={chartSeries}
              type="bar"
              height={280}
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-400">
              데이터가 없습니다
            </div>
          )}
        </motion.div>

        {/* 타입별 상태 분포 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5"
        >
          <h3 className="font-semibold text-slate-700 mb-4">견적서 상태별 금액 분포</h3>
          {typeStatusSummary.length > 0 && typeStatusSummary[0].total > 0 ? (
            <ReactApexChart
              options={statusChartOptions}
              series={[
                typeStatusSummary[0].completed,
                typeStatusSummary[0].pending,
                typeStatusSummary[0].canceled,
                typeStatusSummary[0].expired,
              ]}
              type="donut"
              height={280}
            />
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-400">
              데이터가 없습니다
            </div>
          )}
        </motion.div>
      </div>

      {/* 거래처별 합계 테이블 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-500" />
              거래처별 거래 현황 (상위 20개)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  순위
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  거래처명
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  매출 (견적)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  매입 (발주)
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  거래 건수
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  합계
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companySummary.length > 0 ? (
                companySummary.map((company: CompanySummary, index: number) => (
                  <tr
                    key={company.company_id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/consultations?companyId=${company.company_id}`)}
                  >
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        index < 3 ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">{company.company_name}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600 font-medium">
                      {formatCurrency(company.estimate_amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                      {formatCurrency(company.order_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-slate-600">
                        {company.estimate_count + company.order_count}건
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {formatCurrency(company.estimate_amount + company.order_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Building2 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>거래 데이터가 없습니다</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
