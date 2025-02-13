"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginUser } from "@/app/context/login";

interface CompanyData {
  companyId: string;
  companyName: string;
}

interface DocumentData {
  companyId: string;
  companyName: string;
  lastConsultationDate: string;
  lastEstimateDate: string;
  estimateCount: number;
  cancellationRate: number;
  orderRate: number;
  totalSalesAmount: number;
  totalPurchaseAmount: number;
  lastOrderDate: string;
  orderCount: number;
}

const PerformanceDetails = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useLoginUser();
  const type = searchParams.get("type");

  const [companyList, setCompanyList] = useState<CompanyData[]>([]);
  const [searchCompany, setSearchCompany] = useState("");

  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0]; // YYYY-MM-DD 형식
  const startOfYear = new Date(today.getFullYear(), 0, 1, 9);
  const formattedStartOfYear = startOfYear.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(formattedStartOfYear);
  const [endDate, setEndDate] = useState(formattedToday);

  const [documentData, setDocumentData] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /** ✅ Fetch company list */
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch(
          `/api/reports/performance/details/companies?userId=${user?.id}&type=${type}&startDate=${startDate}&endDate=${endDate}`
        );
        const { data } = await res.json();
        setCompanyList(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    if (user) fetchCompanies();
  }, [user, type]);

  /** ✅ Fetch document data */
  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/performance/details/companies?userId=${user?.id}&type=${type}&search=${searchCompany}&startDate=${startDate}&endDate=${endDate}&page=${currentPage}`
      );
      const { data, totalPages } = await res.json();
      setDocumentData(data);
      setTotalPages(totalPages || 1);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  /** ✅ 검색 버튼 클릭 시 동작 */
  const handleSearch = () => {
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    fetchData();
  };

  /** ✅ Pagination Numbers */
  const paginationNumbers = () => {
    let pageNumbers = [];
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
    <div className="text-sm text-[#37352F]">
      <h1 className="mb-4 font-semibold">영업 상세 분석</h1>

      {/* 검색 UI */}
      <div className="bg-[#FBFBFB] rounded-md border-[1px] px-4 py-4 mb-4">
        <div className="grid grid-cols-4 gap-4">
          {/* 회사명 검색 */}
          <div className="flex items-center">
            <label className="mr-4 font-semibold">회사명 검색</label>
            <input
              type="text"
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value)}
              placeholder="회사명"
              className="w-3/4 p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* 날짜 선택 */}
          <div className="flex items-center">
            <label className="mr-4 font-semibold">시작 날짜</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-3/4 p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex items-center">
            <label className="mr-4 font-semibold">종료 날짜</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-3/4 p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* 검색 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 테이블 UI */}
      <div>
        <table className="min-w-full table-auto border-collapse text-center">
          <thead>
            <tr className="bg-gray-100 text-left">
              {type === "estimate" && (
                <>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    회사명
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    최근상담일
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    최근견적일
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    총견적수
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    견적 승인율
                  </th>
                  <th className="px-4 py-2 border-b text-center">총매출액</th>
                </>
              )}
              {type === "order" && (
                <>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    회사명
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    최근상담일
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    최근발주일
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    총발주수
                  </th>
                  <th className="px-4 py-2 border-b text-center">총매입액</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {type === "estimate" &&
              documentData.map((doc) => (
                <tr key={doc.companyId} className="hover:bg-gray-50">
                  <td
                    className="px-4 py-2 border-b text-blue-500 cursor-pointer border-r-[1px]"
                    onClick={() =>
                      router.push(
                        `/reports/performance/details/${doc.companyId}?type=estimate`
                      )
                    }
                  >
                    {doc.companyName}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {doc.lastConsultationDate.slice(0, 10) || "-"}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {doc.lastEstimateDate.slice(0, 10) || "-"}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {doc.estimateCount}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {doc.orderRate.toFixed(2)}%
                  </td>
                  <td className="px-4 py-2 border-b">
                    {doc.totalSalesAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
            {type === "order" &&
              documentData.map((doc) => (
                <tr key={doc.companyId} className="hover:bg-gray-50">
                  <td
                    className="px-4 py-2 border-b text-blue-500 cursor-pointer border-r-[1px]"
                    onClick={() =>
                      router.push(
                        `/reports/performance/details/${doc.companyId}?type=order`
                      )
                    }
                  >
                    {doc.companyName}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {doc.lastConsultationDate.slice(0, 10) || "-"}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {doc.lastOrderDate.slice(0, 10) || "-"}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px]">
                    {doc.orderCount}
                  </td>
                  <td className="px-4 py-2 border-b">
                    {doc.totalPurchaseAmount.toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 유지 ✅ */}
      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded bg-white"
        >
          이전
        </button>

        {paginationNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && setCurrentPage(page)}
            className={`px-3 py-1 border rounded ${
              currentPage === page
                ? "bg-blue-500 text-white font-bold"
                : "bg-white"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded bg-white"
        >
          다음
        </button>
      </div>
    </div>
  );
};

export default PerformanceDetails;
