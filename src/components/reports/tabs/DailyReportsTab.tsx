"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  Printer,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { DailyReportSummary } from "@/types/reports";

interface DailyReportsTabProps {
  year: number;
  month: number;
}

export default function DailyReportsTab({ year, month }: DailyReportsTabProps) {
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [currentMonth, setCurrentMonth] = useState(month);

  // 날짜 범위 계산
  const getDateRange = () => {
    if (viewMode === "daily") {
      const lastDay = new Date(year, currentMonth, 0).getDate();
      return {
        startDate: `${year}-${String(currentMonth).padStart(2, "0")}-01`,
        endDate: `${year}-${String(currentMonth).padStart(2, "0")}-${lastDay}`,
      };
    } else {
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      };
    }
  };

  const fetchDailyReports = async (): Promise<DailyReportSummary[]> => {
    const { startDate, endDate } = getDateRange();

    const { data: documents, error } = await supabase
      .from("documents")
      .select("date, type, total_amount, status")
      .eq("status", "completed")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching daily reports:", error);
      throw error;
    }

    // 날짜별/월별 집계
    const summaryMap = new Map<
      string,
      {
        estimateCount: number;
        orderCount: number;
        totalSales: number;
        totalPurchases: number;
      }
    >();

    documents?.forEach((doc) => {
      if (!doc.date) return;

      const key = viewMode === "daily" ? doc.date : doc.date.slice(0, 7);
      const existing = summaryMap.get(key) || {
        estimateCount: 0,
        orderCount: 0,
        totalSales: 0,
        totalPurchases: 0,
      };

      const amount = Number(doc.total_amount) || 0;

      if (doc.type === "estimate") {
        existing.estimateCount += 1;
        existing.totalSales += amount;
      } else if (doc.type === "order") {
        existing.orderCount += 1;
        existing.totalPurchases += amount;
      }

      summaryMap.set(key, existing);
    });

    return Array.from(summaryMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  };

  const { data: reports, isLoading } = useSWR(
    `daily-reports-${year}-${currentMonth}-${viewMode}`,
    fetchDailyReports,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  // 합계 계산
  const totals = useMemo(() => {
    const data = reports || [];
    return {
      estimateCount: data.reduce((sum, r) => sum + r.estimateCount, 0),
      orderCount: data.reduce((sum, r) => sum + r.orderCount, 0),
      totalSales: data.reduce((sum, r) => sum + r.totalSales, 0),
      totalPurchases: data.reduce((sum, r) => sum + r.totalPurchases, 0),
    };
  }, [reports]);

  // 팝업 열기
  const openReportPopup = (date: string, type: "estimate" | "order") => {
    const url = `/reports/${type}?date=${date}&fullscreen=true`;
    window.open(url, "_blank", "width=1400,height=800,top=100,left=100");
  };

  // 월 변경
  const changeMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 1) {
        setCurrentMonth(12);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
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

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            {viewMode === "daily" ? "거래일 수" : "거래월 수"}
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {reports?.length || 0}
            {viewMode === "daily" ? "일" : "개월"}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            <TrendingUp className="h-3.5 w-3.5 mr-1 text-blue-500" />
            총 매출
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {totals.totalSales >= 100000000
              ? `${(totals.totalSales / 100000000).toFixed(1)}억`
              : `${(totals.totalSales / 10000).toLocaleString()}만`}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {totals.estimateCount}건
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            <TrendingDown className="h-3.5 w-3.5 mr-1 text-emerald-500" />
            총 매입
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {totals.totalPurchases >= 100000000
              ? `${(totals.totalPurchases / 100000000).toFixed(1)}억`
              : `${(totals.totalPurchases / 10000).toLocaleString()}만`}
          </p>
          <p className="text-xs text-slate-500 mt-1">{totals.orderCount}건</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            <FileText className="h-3.5 w-3.5 mr-1" />
            총 문서
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {totals.estimateCount + totals.orderCount}건
          </p>
        </div>
      </div>

      {/* 컨트롤 영역 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* 일보/월보 토글 */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("daily")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === "daily"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  일보
                </button>
                <button
                  onClick={() => setViewMode("monthly")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === "monthly"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  월보
                </button>
              </div>

              {/* 월 선택 (일보 모드일 때만) */}
              {viewMode === "daily" && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => changeMonth("prev")}
                    className="p-1.5 rounded-lg hover:bg-slate-100"
                  >
                    <ChevronLeft className="h-4 w-4 text-slate-600" />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-medium text-slate-700">
                    {year}년 {currentMonth}월
                  </span>
                  <button
                    onClick={() => changeMonth("next")}
                    className="p-1.5 rounded-lg hover:bg-slate-100"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </button>
                </div>
              )}
            </div>

            <span className="text-sm text-slate-500">
              총 {reports?.length || 0}개 {viewMode === "daily" ? "일자" : "월"}
            </span>
          </div>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  {viewMode === "daily" ? "날짜" : "월"}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">
                  매출 일보
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                  매출액
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">
                  매입 일보
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                  매입액
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">
                  합계
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!reports || reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    해당 기간에 완료된 문서가 없습니다
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.date} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {viewMode === "daily"
                        ? report.date
                        : `${report.date.slice(0, 4)}년 ${report.date.slice(5, 7)}월`}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {report.estimateCount > 0 ? (
                        <button
                          onClick={() => openReportPopup(report.date, "estimate")}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Printer className="h-3 w-3" />
                          매출 일보 ({report.estimateCount})
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600">
                      {report.totalSales > 0
                        ? `${report.totalSales.toLocaleString()}원`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {report.orderCount > 0 ? (
                        <button
                          onClick={() => openReportPopup(report.date, "order")}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <Printer className="h-3 w-3" />
                          매입 일보 ({report.orderCount})
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {report.totalPurchases > 0
                        ? `${report.totalPurchases.toLocaleString()}원`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {(report.totalSales + report.totalPurchases).toLocaleString()}원
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {reports && reports.length > 0 && (
              <tfoot className="bg-slate-50 font-medium">
                <tr>
                  <td className="px-4 py-3 text-slate-700">합계</td>
                  <td className="px-4 py-3 text-center text-blue-600">
                    {totals.estimateCount}건
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600">
                    {totals.totalSales.toLocaleString()}원
                  </td>
                  <td className="px-4 py-3 text-center text-emerald-600">
                    {totals.orderCount}건
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600">
                    {totals.totalPurchases.toLocaleString()}원
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {(totals.totalSales + totals.totalPurchases).toLocaleString()}원
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
