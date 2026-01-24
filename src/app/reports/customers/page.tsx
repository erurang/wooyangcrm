"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Calendar,
  User,
  FileText,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useCompanySalesSummaryWithFilters } from "@/hooks/reports/customers/useCompanySalesSummary";
import { useDebounce } from "@/hooks/useDebounce";

interface CompanySalesSummary {
  company_id: string;
  company_name: string;
  completed_estimates: number;
  completed_orders: number;
  total_sales_amount: number;
  total_purchase_amount: number;
  assigned_sales_reps: string[];
}

export default function CompanySalesReport() {
  const router = useRouter();

  // 날짜 필터 상태
  const [dateFilter, setDateFilter] = useState<"year" | "quarter" | "month">("year");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // 검색 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [salesRepTerm, setSalesRepTerm] = useState("");

  // 디바운스된 검색어 (300ms)
  const debouncedSearch = useDebounce(searchTerm, 300);
  const debouncedSalesRep = useDebounce(salesRepTerm, 300);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // 날짜 변환
  let startDate: string;
  let endDate: string;

  if (dateFilter === "year") {
    startDate = `${selectedYear}-01-01`;
    endDate = `${selectedYear}-12-31`;
  } else if (dateFilter === "quarter") {
    startDate = `${selectedYear}-${String((selectedQuarter - 1) * 3 + 1).padStart(2, "0")}-01`;
    endDate = new Date(selectedYear, selectedQuarter * 3, 0).toISOString().split("T")[0];
  } else {
    startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
    endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0];
  }

  // 서버 측 필터링 API 호출
  const {
    companySalesSummary,
    total,
    totalPages: serverTotalPages,
    isLoading,
  } = useCompanySalesSummaryWithFilters({
    startDate,
    endDate,
    search: debouncedSearch,
    salesRep: debouncedSalesRep,
    page: currentPage,
    limit: itemsPerPage,
  });

  // 데이터 배열 (이미 서버에서 필터링 및 페이지네이션됨)
  const paginatedData = companySalesSummary || [];
  const totalPages = serverTotalPages || 1;

  // 전체 합계 계산 (서버에서 필터링된 전체 데이터 기준으로 계산)
  // 참고: 정확한 통계를 위해서는 별도 API가 필요하지만, 현재 페이지 데이터로 계산
  const totalStats = useMemo(() => {
    return paginatedData.reduce(
      (acc: { estimates: number; orders: number; sales: number; purchase: number }, company: CompanySalesSummary) => ({
        estimates: acc.estimates + (company.completed_estimates || 0),
        orders: acc.orders + (company.completed_orders || 0),
        sales: acc.sales + (company.total_sales_amount || 0),
        purchase: acc.purchase + (company.total_purchase_amount || 0),
      }),
      { estimates: 0, orders: 0, sales: 0, purchase: 0 }
    );
  }, [paginatedData]);

  // 기간 라벨
  const getPeriodLabel = () => {
    if (dateFilter === "year") return `${selectedYear}년`;
    if (dateFilter === "quarter") return `${selectedYear}년 ${selectedQuarter}분기`;
    return `${selectedYear}년 ${selectedMonth}월`;
  };

  // 페이지네이션 렌더링
  const renderPagination = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="text-sm">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-teal-500" />
              거래처별 실적
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              거래처별 매출/매입 실적을 확인하고 분석하세요.
            </p>
          </div>
          <div className="text-sm text-slate-600">
            총 <span className="font-bold text-teal-600">{total}</span>개 거래처
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
          {/* 거래처명 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="거래처명 검색..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            />
          </div>

          {/* 담당자 검색 */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="담당 영업사원 검색..."
              value={salesRepTerm}
              onChange={(e) => {
                setSalesRepTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            />
          </div>

          {/* 기간 선택 */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            >
              {Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                );
              })}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as "year" | "quarter" | "month");
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            >
              <option value="year">연간</option>
              <option value="quarter">분기</option>
              <option value="month">월간</option>
            </select>
            {dateFilter === "quarter" && (
              <select
                value={selectedQuarter}
                onChange={(e) => {
                  setSelectedQuarter(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              >
                <option value="1">1분기</option>
                <option value="2">2분기</option>
                <option value="3">3분기</option>
                <option value="4">4분기</option>
              </select>
            )}
            {dateFilter === "month" && (
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}월
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 표시 개수 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">표시:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
            >
              <option value="10">10개</option>
              <option value="20">20개</option>
              <option value="30">30개</option>
              <option value="50">50개</option>
            </select>
          </div>
        </div>

        {/* 현재 기간 & 합계 */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            조회 기간: <span className="font-medium text-slate-700">{getPeriodLabel()}</span>
          </span>
          <div className="flex flex-wrap gap-3 ml-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg"
            >
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-blue-700">
                견적 <span className="font-bold">{totalStats.estimates.toLocaleString()}</span>건
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg"
            >
              <ShoppingCart className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-purple-700">
                발주 <span className="font-bold">{totalStats.orders.toLocaleString()}</span>건
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg"
            >
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-emerald-700">
                매출 <span className="font-bold">{totalStats.sales.toLocaleString()}</span>원
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-1.5 bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg"
            >
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-700">
                매입 <span className="font-bold">{totalStats.purchase.toLocaleString()}</span>원
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 mt-3">데이터를 불러오는 중...</p>
          </div>
        </div>
      ) : paginatedData.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 w-1/4">
                    거래처명
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 w-20">
                    견적
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 w-20">
                    발주
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 w-1/5">
                    총 매출
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 w-1/5">
                    총 매입
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                    담당자
                  </th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map((company: any) => (
                  <tr
                    key={company.company_id}
                    onClick={() => router.push(`/reports/customers/${company.company_id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-teal-600" />
                        </div>
                        <span className="font-medium text-slate-800 group-hover:text-teal-600 transition-colors truncate">
                          {company.company_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {company.completed_estimates}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {company.completed_orders}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-emerald-600">
                        {company.total_sales_amount.toLocaleString()}
                      </span>
                      <span className="text-slate-400 ml-1">원</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-red-500">
                        {company.total_purchase_amount.toLocaleString()}
                      </span>
                      <span className="text-slate-400 ml-1">원</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {company.assigned_sales_reps.length > 0 ? (
                          company.assigned_sales_reps.slice(0, 2).map((rep: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs"
                            >
                              {rep}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                        {company.assigned_sales_reps.length > 2 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                            +{company.assigned_sales_reps.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center text-slate-400">
            <Building2 className="w-12 h-12 mb-4" />
            <p>검색 결과가 없습니다.</p>
          </div>
        </div>
      )}

      {/* 페이지네이션 */}
      {!isLoading && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1">
              {renderPagination().map((page, index) =>
                page === "..." ? (
                  <span key={`ellipsis-${index}`} className="px-2 py-1.5 text-slate-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(Number(page))}
                    className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-teal-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
