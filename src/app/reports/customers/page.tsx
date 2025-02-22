"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCompanySalesSummary } from "@/hooks/reports/customers/useCompanySalesSummary";

export default function CompanySalesReport() {
  const router = useRouter();

  // ✅ 날짜 필터 상태
  const [dateFilter, setDateFilter] = useState<"year" | "quarter" | "month">(
    "year"
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );

  // ✅ 검색 필터 상태
  const [searchTerm, setSearchTerm] = useState(""); // 거래처명 검색
  const [salesRepTerm, setSalesRepTerm] = useState(""); // 담당 영업사원 검색

  // ✅ 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 페이지당 항목 개수

  // ✅ 날짜 변환 (연도별, 분기별, 월별)
  let startDate: string;
  let endDate: string;

  if (dateFilter === "year") {
    startDate = `${selectedYear}-01-01`;
    endDate = `${selectedYear}-12-31`;
  } else if (dateFilter === "quarter") {
    startDate = `${selectedYear}-${(selectedQuarter - 1) * 3 + 1}-01`;
    endDate = new Date(selectedYear, selectedQuarter * 3, 0)
      .toISOString()
      .split("T")[0];
  } else {
    startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
    endDate = new Date(selectedYear, selectedMonth, 0)
      .toISOString()
      .split("T")[0];
  }

  // ✅ API 호출 (SWR 사용)
  const { companySalesSummary, isLoading, isError } = useCompanySalesSummary(
    startDate,
    endDate
  );

  // ✅ 검색 필터 적용
  const filteredData =
    companySalesSummary?.filter((company: any) => {
      const companyNameMatch = company.company_name
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase());

      const salesRepMatch =
        salesRepTerm.trim() === "" ||
        company.assigned_sales_reps.some((rep: string) =>
          rep.toLowerCase().includes(salesRepTerm.trim().toLowerCase())
        );

      return companyNameMatch && salesRepMatch;
    }) ?? [];

  // ✅ 총 페이지 수 계산 (최소 1페이지 보장)
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  // ✅ 현재 페이지 데이터
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ✅ 페이지네이션 숫자 생성 함수
  const paginationNumbers = () => {
    let pageNumbers: (number | string)[] = [];
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

  // ✅ Enter 키 검색 실행
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setCurrentPage(1);
    }
  };

  return (
    <div className="text-sm text-[#333]">
      <p className="mb-4 font-semibold">거래처별 분석</p>

      {/* 🔹 검색 & 필터 UI */}
      <div className="bg-[#FBFBFB] rounded-md border-[1px] p-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="flex items-center justify-center">
          <label className="w-1/4 block p-2 border rounded-l-md bg-gray-100">
            거래처명
          </label>
          <motion.input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // ✅ 검색 시 페이지 1로 이동
            }}
            onKeyDown={handleKeyPress}
            placeholder="거래처명"
            className="w-3/4 p-2 border rounded-r-md"
          />
        </div>

        {/* 🔹 담당 영업사원 검색 */}
        <div className="flex items-center justify-center">
          <label className="w-1/4 block p-2 border rounded-l-md bg-gray-100">
            담당자
          </label>
          <motion.input
            value={salesRepTerm}
            onChange={(e) => {
              setSalesRepTerm(e.target.value);
              setCurrentPage(1); // ✅ 검색 시 페이지 1로 이동
            }}
            onKeyDown={handleKeyPress}
            placeholder="담당 영업사원"
            className="w-3/4 p-2 border rounded-r-md"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* 🔹 라벨 */}
          <label className="block p-2 border rounded-md bg-gray-100 min-w-[70px]">
            기간선택
          </label>

          <select
            className="border-2 border-blue-400 p-2 rounded-md text-gray-700"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setCurrentPage(1); // ✅ 연도 변경 시 페이지 1로 이동
            }}
          >
            {Array.from(
              { length: new Date().getFullYear() - 2010 + 1 },
              (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              }
            )}
          </select>

          <select
            className="border p-2 rounded-md"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value as "year" | "quarter" | "month");
              setCurrentPage(1); // ✅ 필터 변경 시 페이지 1로 이동
            }}
          >
            <option value="year">연도별</option>
            <option value="quarter">분기별</option>
            <option value="month">월별</option>
          </select>

          {dateFilter === "quarter" && (
            <select
              className="border p-2 rounded-md"
              value={selectedQuarter}
              onChange={(e) => {
                setSelectedQuarter(Number(e.target.value));
                setCurrentPage(1); // ✅ 분기 변경 시 페이지 1로 이동
              }}
            >
              <option value="1">1분기 (1~3월)</option>
              <option value="2">2분기 (4~6월)</option>
              <option value="3">3분기 (7~9월)</option>
              <option value="4">4분기 (10~12월)</option>
            </select>
          )}

          {dateFilter === "month" && (
            <select
              className="border p-2 rounded-md"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setCurrentPage(1); // ✅ 월 변경 시 페이지 1로 이동
              }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}월
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="mt-4 bg-[#FBFBFB] rounded-md border p-4">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-4 py-2 border-b border-r">거래처명</th>
              <th className="px-4 py-2 border-b border-r">견적서</th>
              <th className="px-4 py-2 border-b border-r">발주서</th>
              <th className="px-4 py-2 border-b border-r">총 매출</th>
              <th className="px-4 py-2 border-b border-r">총 매입</th>
              <th className="px-4 py-2 border-b border-r">담당 영업사원</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((company: any) => (
              <tr key={company.company_id}>
                <td
                  className="px-4 py-2 border-b border-r text-blue-500 cursor-pointer"
                  onClick={() =>
                    router.push(`/reports/customers/${company.company_id}`)
                  }
                >
                  {company.company_name}
                </td>
                <td className="px-4 py-2 border-b border-r">
                  {company.completed_estimates}
                </td>
                <td className="px-4 py-2 border-b border-r">
                  {company.completed_orders}
                </td>
                <td className="px-4 py-2 border-b border-r">
                  {company.total_sales_amount.toLocaleString()} 원
                </td>
                <td className="px-4 py-2 border-b border-r">
                  {company.total_purchase_amount.toLocaleString()} 원
                </td>
                <td className="px-4 py-2 border-b border-r">
                  {company.assigned_sales_reps.join(", ") || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
        >
          이전
        </button>

        {paginationNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(Number(page))}
            className={`px-3 py-1 border rounded ${
              currentPage === page
                ? "bg-blue-500 text-white font-bold"
                : "bg-gray-50 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
        >
          다음
        </button>
      </div>
    </div>
  );
}
