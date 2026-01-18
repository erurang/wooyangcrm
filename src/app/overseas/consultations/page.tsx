"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Globe, ChevronLeft, ChevronRight } from "lucide-react";

import { useOverseasConsultations, useOverseasCompanies } from "@/hooks/overseas";
import { useDebounce } from "@/hooks/useDebounce";
import EmptyState from "@/components/ui/EmptyState";

export default function OverseasConsultationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터
  const initialPage = searchParams.get("page")
    ? parseInt(searchParams.get("page") as string)
    : 1;
  const initialCompanyId = searchParams.get("company_id") || "";
  const initialKeyword = searchParams.get("keyword") || "";

  // 필터 상태
  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Debounced search & date filters (300ms) - 입력 시 깜빡임 방지
  const debouncedKeyword = useDebounce(keyword, 300);
  const debouncedStartDate = useDebounce(startDate, 300);
  const debouncedEndDate = useDebounce(endDate, 300);

  // Hooks
  const { consultations, total, isLoading } = useOverseasConsultations({
    page: currentPage,
    limit: itemsPerPage,
    companyId,
    keyword: debouncedKeyword,
    startDate: debouncedStartDate,
    endDate: debouncedEndDate,
  });

  const { companies } = useOverseasCompanies({ limit: 100 });

  // URL 업데이트
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage !== 1) params.set("page", currentPage.toString());
    if (companyId) params.set("company_id", companyId);
    if (keyword) params.set("keyword", keyword);
    router.replace(`/overseas/consultations?${params.toString()}`);
  }, [currentPage, companyId, keyword, router]);

  // 페이지 수 업데이트
  useEffect(() => {
    if (!isLoading) {
      setTotalPages(Math.ceil(total / itemsPerPage));
    }
  }, [total, isLoading, itemsPerPage]);

  // 필터 초기화
  const resetFilters = () => {
    setCompanyId("");
    setKeyword("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const hasActiveFilters = companyId || keyword || startDate || endDate;

  // 페이지네이션 번호
  const paginationNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pageNumbers.push(i);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        pageNumbers.push("...");
      }
    }
    return pageNumbers;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-sm text-slate-800">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Globe className="h-5 w-5 text-teal-600" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">해외 상담내역 조회</h1>
          </div>

          {/* 필터 */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* 거래처 선택 */}
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors min-w-[140px]"
            >
              <option value="">전체 거래처</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>

            {/* 기간 */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />
            <span className="text-slate-400">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
            />

            {/* 키워드 검색 */}
            <div className="relative flex-1 min-w-[140px] max-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
                placeholder="상담내용 검색..."
              />
            </div>

            {/* 초기화 버튼 */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={14} />
                초기화
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 테이블 컨트롤 */}
      <div className="flex justify-between items-center px-4 py-3">
        <div className="text-sm text-slate-500">
          총 <span className="font-semibold text-teal-600">{total}</span>건
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">표시:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
          >
            <option value="10">10개</option>
            <option value="20">20개</option>
            <option value="30">30개</option>
            <option value="50">50개</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="p-4 pt-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-slate-500">상담내역을 불러오는 중...</p>
            </div>
          ) : consultations && consultations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                      일자
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                      거래처
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                      담당자
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                      상담내용
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 hidden lg:table-cell">
                      작성자
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consultations.map((consultation) => (
                    <tr
                      key={consultation.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/overseas/${consultation.company_id}`)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-slate-700">
                          {consultation.date}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-teal-600 hover:text-teal-700">
                          {consultation.company_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-slate-700">
                          {consultation.contact_name || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-700 line-clamp-2 max-w-md">
                          {consultation.content}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm text-slate-500">
                          {consultation.user_name}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState type="search" />
          )}
        </div>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center px-4 pb-4">
          <nav className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            <button
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === 1
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {paginationNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && setCurrentPage(page)}
                className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-teal-600 text-white"
                    : page === "..."
                    ? "text-slate-400 cursor-default"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg transition-colors ${
                currentPage === totalPages
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
