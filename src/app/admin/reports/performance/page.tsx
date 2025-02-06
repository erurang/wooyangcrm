"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface PerformanceData {
  userId: string;
  userName: string;
  totalSales: number;
  totalPurchases: number;
}

const PerformanceAdminPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0]; // YYYY-MM-DD
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const formattedStartOfYear = startOfYear.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") || formattedStartOfYear
  );
  const [endDate, setEndDate] = useState(
    searchParams.get("endDate") || formattedToday
  );
  const [searchUser, setSearchUser] = useState(
    searchParams.get("search") || ""
  );
  const [data, setData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/reports/performance?startDate=${startDate}&endDate=${endDate}&search=${searchUser}`
      );
      const result = await res.json();
      setData(result.data || []);
    } catch (error) {
      console.error("Error fetching performance data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    // ✅ URL 쿼리 업데이트
    const query = new URLSearchParams({
      startDate,
      endDate,
      search: searchUser,
    }).toString();
    router.push(`/admin/reports/performance?${query}`);
    fetchData();
  };

  // ✅ ApexCharts 데이터 변환
  const series = [
    { name: "매출액 (₩)", data: data.map((user) => user.totalSales) },
    { name: "매입액 (₩)", data: data.map((user) => user.totalPurchases) },
  ];

  const options = {
    xaxis: {
      categories: data.map((user) => user.userName), // ✅ X축에 직원 이름 표시
    },
    yaxis: {
      logarithmic: true, // ✅ 로그 스케일 적용
      labels: {
        formatter: (val: number) => {
          if (val >= 1_000_000_000)
            return `${(val / 1_000_000_000).toFixed(0)}B₩`;
          if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M₩`;
          if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K₩`;
          return `${val.toFixed(0)}₩`; // ✅ 소수점 제거
        },
      },
    },
  };

  return (
    <div className="text-sm text-[#37352F]">
      <h1 className="mb-4 font-semibold">📊 직원별 영업 성과</h1>

      {/* 🔹 필터링 UI */}
      <div className="bg-[#FBFBFB] rounded-md border px-4 py-4 mb-4">
        <div className="grid grid-cols-4 gap-4">
          {/* 날짜 필터 */}
          <div className="flex items-center">
            <label className="mr-2 font-semibold">시작 날짜</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-3/4 p-2 border rounded-md"
            />
          </div>
          <div className="flex items-center">
            <label className="mr-2 font-semibold">종료 날짜</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-3/4 p-2 border rounded-md"
            />
          </div>
          {/* 직원 검색 */}
          <div className="flex items-center">
            <label className="mr-2 font-semibold">직원 검색</label>
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="이름 또는 이메일"
              className="w-3/4 p-2 border rounded-md"
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

      {/* 🔹 로딩 UI */}
      {loading && (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">📊 데이터를 불러오는 중...</p>
        </div>
      )}

      {/* 🔹 데이터 없음 UI */}
      {!loading && data.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
          <p className="text-lg font-semibold">📉 표시할 데이터가 없어요.</p>
          <p className="text-sm">이 기간 동안 영업 기록이 없습니다.</p>
        </div>
      )}

      {/* 🔹 ApexCharts */}
      {!loading && data.length > 0 && (
        <div className="mt-6 bg-[#FBFBFB] p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold">직원별 매출/매입 비교</h2>
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={400}
          />
        </div>
      )}
    </div>
  );
};

export default PerformanceAdminPage;
