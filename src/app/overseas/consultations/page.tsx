"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircularProgress } from "@mui/material";
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
    <div className="text-sm text-gray-800">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-6">
        <Globe size={24} className="text-blue-500" />
        <h1 className="text-xl font-semibold">해외 상담내역 조회</h1>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* 거래처 선택 */}
          <div className="min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">거래처</label>
            <select
              value={companyId}
              onChange={(e) => {
                setCompanyId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">전체</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          {/* 기간 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* 키워드 검색 */}
          <div className="flex-grow min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">키워드</label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="상담 내용 검색"
              />
            </div>
          </div>

          {/* 초기화 버튼 */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X size={14} />
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 테이블 컨트롤 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          총 <span className="font-semibold text-blue-600">{total}</span>건
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">표시 개수:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="10">10개</option>
            <option value="20">20개</option>
            <option value="30">30개</option>
            <option value="50">50개</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <CircularProgress size={40} />
          </div>
        ) : consultations && consultations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    일자
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거래처
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    담당자
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상담내용
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    작성자
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consultations.map((consultation) => (
                  <tr
                    key={consultation.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/overseas/${consultation.company_id}`)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {consultation.date}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        {consultation.company_name}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {consultation.contact_name || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 line-clamp-2 max-w-md">
                        {consultation.content}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-500">
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

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronLeft size={18} />
            </button>

            {paginationNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-md ${
                  currentPage === page
                    ? "bg-blue-600 text-white font-medium"
                    : page === "..."
                    ? "text-gray-500 cursor-default"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
