"use client";

import { useState } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabaseClient";

const ItemsPerPage = 20; // 한 페이지당 표시할 개수

const useCompletedReports = () => {
  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("created_at, type")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      return { daily: [], monthly: [], counts: {} };
    }

    // 🔹 날짜별 그룹화 (YYYY-MM-DD -> YYYY-MM 변환)
    const dailyReports = [
      ...new Set(data.map((doc) => doc.created_at.split("T")[0])),
    ];
    const monthlyReports = [
      ...new Set(data.map((doc) => doc.created_at.slice(0, 7))),
    ];

    // 🔥 매출/매입 개수 카운트
    const counts = data.reduce(
      (acc: Record<string, { estimate: number; order: number }>, doc) => {
        const date = doc.created_at.split("T")[0]; // 일자별
        const month = doc.created_at.slice(0, 7); // 월별

        // 🔹 날짜별 카운트 증가
        if (!acc[date]) acc[date] = { estimate: 0, order: 0 };
        acc[date][doc.type as "estimate" | "order"]++;

        // 🔹 월별 카운트 증가
        if (!acc[month]) acc[month] = { estimate: 0, order: 0 };
        acc[month][doc.type as "estimate" | "order"]++;

        return acc;
      },
      {}
    );

    return {
      daily: dailyReports.sort().reverse(),
      monthly: monthlyReports.sort().reverse(),
      counts,
    };
  };

  const { data, error } = useSWR("completedReports", fetchReports);

  return {
    dailyReports: data?.daily || [],
    monthlyReports: data?.monthly || [],
    counts: data?.counts || {},
    isLoading: !data && !error,
  };
};

const ReportsOverview = () => {
  const { dailyReports, monthlyReports, counts, isLoading } =
    useCompletedReports();

  // 🔹 페이지네이션 관련 상태 (일보 & 월보 개별 관리)
  const [currentDailyPage, setCurrentDailyPage] = useState<number>(1);
  const [currentMonthlyPage, setCurrentMonthlyPage] = useState<number>(1);

  const dailyTotalPages = Math.ceil(dailyReports.length / ItemsPerPage);
  const monthlyTotalPages = Math.ceil(monthlyReports.length / ItemsPerPage);

  const paginatedDailyReports = dailyReports.slice(
    (currentDailyPage - 1) * ItemsPerPage,
    currentDailyPage * ItemsPerPage
  );

  const paginatedMonthlyReports = monthlyReports.slice(
    (currentMonthlyPage - 1) * ItemsPerPage,
    currentMonthlyPage * ItemsPerPage
  );

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="text-sm text-[#37352F]">
      <p className="mb-4 font-semibold">매출/매입 리포트</p>

      <div className="grid grid-cols-2 gap-4">
        {/* 🔹 매출/매입 일보 테이블 */}
        <div>
          <h2 className="text-lg font-bold mb-2">매출/매입 일보</h2>
          <div className="bg-[#FBFBFB] rounded-md border">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-r-[1px] px-4 py-2">날짜</th>
                  <th className="border-b border-r-[1px] px-4 py-2">
                    매출 일보
                  </th>
                  <th className="border-b  px-4 py-2">매입 일보</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDailyReports.map((date) => (
                  <tr key={date} className=" text-center border-b ">
                    <td className="border-r-[1px] px-4 py-2">{date}</td>
                    <td
                      className={`border-r-[1px] px-4 py-2 cursor-pointer ${
                        counts[date]?.estimate
                          ? "text-blue-500 hover:font-bold"
                          : "text-gray-400 cursor-default"
                      }`}
                      onClick={() =>
                        counts[date]?.estimate &&
                        window.open(
                          `/reports/estimate?date=${date}&fullscreen=true`,
                          "_blank",
                          "width=1800,height=800,top=100,left=100"
                        )
                      }
                    >
                      {counts[date]?.estimate ? "매출 일보 보기" : "매출 없음"}
                    </td>
                    <td
                      className={`px-4 py-2 cursor-pointer ${
                        counts[date]?.order
                          ? "text-blue-500 hover:font-bold"
                          : "text-gray-400 cursor-default"
                      }`}
                      onClick={() =>
                        counts[date]?.order &&
                        window.open(
                          `/reports/order?date=${date}&fullscreen=true`,
                          "_blank",
                          "width=1800,height=800,top=100,left=100"
                        )
                      }
                    >
                      {counts[date]?.order ? "매입 일보 보기" : "매입 없음"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentDailyPage}
            totalPages={dailyTotalPages}
            setCurrentPage={setCurrentDailyPage}
          />
        </div>

        {/* 🔹 매출/매입 월보 테이블 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">매출/매입 월보</h2>
          <div className="bg-[#FBFBFB] rounded-md border">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-b border-r-[1px] px-4 py-2">날짜</th>
                  <th className="border-b border-r-[1px] px-4 py-2">
                    매출 월보
                  </th>
                  <th className="border-b  px-4 py-2">매입 월보</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMonthlyReports.map((month) => (
                  <tr key={month} className="text-center">
                    <td className="border-b border-r-[1px] px-4 py-2">
                      {month}
                    </td>
                    <td
                      className={`border-r-[1px] border-b-[1px] px-4 py-2 cursor-pointer ${
                        counts[month]?.estimate
                          ? "text-blue-500 hover:font-bold"
                          : "text-gray-400 cursor-default"
                      }`}
                      onClick={() =>
                        counts[month]?.estimate &&
                        window.open(
                          `/reports/estimate?date=${month}&fullscreen=true`,
                          "_blank",
                          "width=1200,height=800,top=100,left=100"
                        )
                      }
                    >
                      {counts[month]?.estimate ? "매출 월보 보기" : "매출 없음"}
                    </td>
                    <td
                      className={`px-4 py-2 border-b-[1px] cursor-pointer ${
                        counts[month]?.order
                          ? "text-blue-500 hover:font-bold"
                          : "text-gray-400 cursor-default"
                      }`}
                      onClick={() =>
                        counts[month]?.order &&
                        window.open(
                          `/reports/order?date=${month}&fullscreen=true`,
                          "_blank",
                          "width=1200,height=800,top=100,left=100"
                        )
                      }
                    >
                      {counts[month]?.order ? "매입 월보 보기" : "매입 없음"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentMonthlyPage}
            totalPages={monthlyTotalPages}
            setCurrentPage={setCurrentMonthlyPage}
          />
        </div>
      </div>
    </div>
  );
};

// 🔹 페이지네이션 컴포넌트
const Pagination = ({
  currentPage,
  totalPages,
  setCurrentPage,
}: {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}) => {
  const paginationNumbers = () => {
    let pages: (number | string)[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pages.push(i);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        pages.push("...");
      }
    }

    return pages;
  };

  return (
    <div className="flex justify-center mt-4 overflow-x-auto space-x-1 md:space-x-2">
      <button
        onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
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
              : "bg-gray-50 text-gray-600 hover:bg-gray-200"
          }`}
          disabled={typeof page !== "number"}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"
      >
        다음
      </button>
    </div>
  );
};

export default ReportsOverview;
