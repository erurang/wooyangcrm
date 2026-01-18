"use client";

import { useState, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  FileText,
  ShoppingCart,
  Calendar,
  Building2,
  User,
  Package,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import {
  useSalesReports,
  usePurchaseReports,
} from "@/hooks/reports/useReports";

interface ReportItem {
  name: string;
  spec?: string;
  quantity?: string | number;
  unit_price?: number;
  amount?: number;
}

interface ReportUser {
  name: string;
  level: string;
}

interface Report {
  id: string;
  document_number?: string;
  company_name?: string;
  total_amount?: number;
  status?: string;
  date?: string;
  content: {
    items?: ReportItem[];
  };
  users?: ReportUser;
}

const ReportsPage = () => {
  const { type } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dateParam = searchParams.get("date");

  // 날짜 상태 관리
  const today = new Date();
  const [viewMode, setViewMode] = useState<"daily" | "monthly">(
    dateParam?.length === 7 ? "monthly" : "daily"
  );
  const [selectedDate, setSelectedDate] = useState(
    dateParam || today.toISOString().split("T")[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(
    dateParam?.substring(0, 7) || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  // 검색 및 필터
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed" | "canceled">("all");

  // 현재 선택된 날짜
  const currentDate = viewMode === "daily" ? selectedDate : selectedMonth;

  // 데이터 가져오기
  const { salesReports, isLoading: isSalesLoading } = useSalesReports(currentDate);
  const { purchaseReports, isLoading: isPurchaseLoading } = usePurchaseReports(currentDate);

  const isEstimate = type === "estimate";
  const reports: Report[] = isEstimate ? salesReports : purchaseReports;
  const isLoading = isEstimate ? isSalesLoading : isPurchaseLoading;

  // 필터링된 데이터
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        searchTerm === "" ||
        report.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.document_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || report.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchTerm, statusFilter]);

  // 통계 계산
  const stats = useMemo(() => {
    const total = filteredReports.reduce((sum, r) => sum + (r.total_amount ?? 0), 0);
    const count = filteredReports.length;
    const completed = filteredReports.filter((r) => r.status === "completed").length;
    const pending = filteredReports.filter((r) => r.status === "pending").length;
    const canceled = filteredReports.filter((r) => r.status === "canceled").length;
    return { total, count, completed, pending, canceled };
  }, [filteredReports]);

  // 날짜 이동
  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "daily") {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() + (direction === "next" ? 1 : -1));
      const newDate = date.toISOString().split("T")[0];
      setSelectedDate(newDate);
      router.push(`/reports/${type}?date=${newDate}`);
    } else {
      const [year, month] = selectedMonth.split("-").map(Number);
      const date = new Date(year, month - 1 + (direction === "next" ? 1 : -1), 1);
      const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      setSelectedMonth(newMonth);
      router.push(`/reports/${type}?date=${newMonth}`);
    }
  };

  // 날짜 포맷팅
  const formatDateLabel = () => {
    if (viewMode === "daily") {
      const date = new Date(selectedDate);
      return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${
        ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
      })`;
    } else {
      const [year, month] = selectedMonth.split("-");
      return `${year}년 ${parseInt(month)}월`;
    }
  };

  // 상태 배지 색상
  const getStatusStyle = (status?: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "canceled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "completed":
        return "완료";
      case "pending":
        return "대기";
      case "canceled":
        return "취소";
      default:
        return status || "-";
    }
  };

  return (
    <div className="text-sm">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
              isEstimate
                ? "bg-gradient-to-br from-blue-500 to-blue-600"
                : "bg-gradient-to-br from-purple-500 to-purple-600"
            }`}>
              {isEstimate ? (
                <FileText className="w-6 h-6 text-white" />
              ) : (
                <ShoppingCart className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {isEstimate ? "매출 일보/월보" : "매입 일보/월보"}
              </h1>
              <p className="text-sm text-slate-500">
                {viewMode === "daily" ? "일별" : "월별"} {isEstimate ? "견적서" : "발주서"} 현황
              </p>
            </div>
          </div>

          {/* 날짜 선택 */}
          <div className="flex items-center gap-3">
            {/* 일보/월보 전환 */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => {
                  setViewMode("daily");
                  router.push(`/reports/${type}?date=${selectedDate}`);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === "daily"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                일보
              </button>
              <button
                onClick={() => {
                  setViewMode("monthly");
                  router.push(`/reports/${type}?date=${selectedMonth}`);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === "monthly"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                월보
              </button>
            </div>

            {/* 날짜 네비게이션 */}
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
              <button
                onClick={() => navigateDate("prev")}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-700 min-w-[160px] text-center">
                  {formatDateLabel()}
                </span>
              </div>
              <button
                onClick={() => navigateDate("next")}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* 날짜 직접 선택 */}
            <input
              type={viewMode === "daily" ? "date" : "month"}
              value={viewMode === "daily" ? selectedDate : selectedMonth}
              onChange={(e) => {
                if (viewMode === "daily") {
                  setSelectedDate(e.target.value);
                  router.push(`/reports/${type}?date=${e.target.value}`);
                } else {
                  setSelectedMonth(e.target.value);
                  router.push(`/reports/${type}?date=${e.target.value}`);
                }
              }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className={`rounded-xl p-4 ${isEstimate ? "bg-blue-50 border border-blue-100" : "bg-purple-50 border border-purple-100"}`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`w-4 h-4 ${isEstimate ? "text-blue-600" : "text-purple-600"}`} />
              <span className={`text-xs font-medium ${isEstimate ? "text-blue-700" : "text-purple-700"}`}>
                총 {isEstimate ? "매출" : "매입"}액
              </span>
            </div>
            <p className={`text-xl font-bold ${isEstimate ? "text-blue-600" : "text-purple-600"}`}>
              {(stats.total / 10000).toLocaleString()}
              <span className="text-xs font-normal ml-1">만원</span>
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-700">총 건수</span>
            </div>
            <p className="text-xl font-bold text-slate-800">
              {stats.count}
              <span className="text-xs font-normal ml-1">건</span>
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-emerald-700">완료</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">
              {stats.completed}
              <span className="text-xs font-normal ml-1">건</span>
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-amber-700">대기</span>
            </div>
            <p className="text-xl font-bold text-amber-600">
              {stats.pending}
              <span className="text-xs font-normal ml-1">건</span>
            </p>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-red-700">취소</span>
            </div>
            <p className="text-xl font-bold text-red-600">
              {stats.canceled}
              <span className="text-xs font-normal ml-1">건</span>
            </p>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="거래처명 또는 문서번호 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <option value="all">전체 상태</option>
              <option value="completed">완료</option>
              <option value="pending">대기</option>
              <option value="canceled">취소</option>
            </select>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className={`w-10 h-10 border-2 ${isEstimate ? "border-blue-600" : "border-purple-600"} border-t-transparent rounded-full animate-spin`} />
            <p className="text-sm text-slate-500 mt-4">데이터를 불러오는 중입니다...</p>
          </div>
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 w-12">No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 w-32">문서번호</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">거래처</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">품목</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 w-28">금액</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 w-20">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 w-28">담당자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report, index) => {
                  const items = (report.content?.items as ReportItem[] | undefined) || [];
                  const userName = (report.users as unknown as ReportUser)?.name || "-";
                  const userLevel = (report.users as unknown as ReportUser)?.level || "";

                  return (
                    <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-center text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{report.document_number || "-"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-slate-500" />
                          </div>
                          <span className="font-medium text-slate-800 truncate max-w-[200px]">
                            {report.company_name || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {items.length > 0 ? (
                          <div className="space-y-1">
                            {items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Package className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-700">{item.name}</span>
                                {item.spec && (
                                  <span className="text-slate-400 text-xs">({item.spec})</span>
                                )}
                                {item.quantity && (
                                  <span className="text-slate-500 text-xs ml-1">x{item.quantity}</span>
                                )}
                              </div>
                            ))}
                            {items.length > 2 && (
                              <span className="text-xs text-slate-400">외 {items.length - 2}건</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${isEstimate ? "text-blue-600" : "text-purple-600"}`}>
                          {(report.total_amount ?? 0).toLocaleString()}
                        </span>
                        <span className="text-slate-400 text-xs ml-1">원</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${getStatusStyle(report.status)}`}>
                          {getStatusLabel(report.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-700">{userName}</span>
                          {userLevel && (
                            <span className="text-slate-400 text-xs">{userLevel}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 테이블 푸터 */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <span className="text-sm text-slate-500">
              총 {filteredReports.length}건
            </span>
            <span className={`text-sm font-bold ${isEstimate ? "text-blue-600" : "text-purple-600"}`}>
              합계: {stats.total.toLocaleString()}원
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center text-slate-400">
            {isEstimate ? (
              <FileText className="w-12 h-12 mb-4" />
            ) : (
              <ShoppingCart className="w-12 h-12 mb-4" />
            )}
            <p className="text-lg font-medium mb-1">데이터가 없습니다</p>
            <p className="text-sm">
              {formatDateLabel()}에 등록된 {isEstimate ? "견적서" : "발주서"}가 없습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
