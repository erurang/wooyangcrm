"use client";

import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

import React, { useEffect, useState } from "react";
import { useLoginUser } from "@/app/context/login";
import { useSearchParams, useRouter } from "next/navigation";

interface PerformanceData {
  monthlyPurchases: number[]; // 매입 금액
  monthlySales: number[]; // 매출 금액
  productSummary: {
    sales: Record<string, number[]>; // 매출 제품 데이터
    purchases: Record<string, number[]>; // 매입 제품 데이터
  };
}

const PerformancePage = () => {
  const user = useLoginUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [performanceData, setPerformanceData] =
    useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const year = searchParams.get("year") || currentYear.toString(); // 기본값: 현재 연도

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedYear = e.target.value;
    router.push(`/reports/performance?year=${selectedYear}`);
  };

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoading(true);

      const res = await fetch(
        `/api/reports/performance?userId=${user?.id}&year=${year}`
      );
      const data = await res.json();

      if (res.ok) {
        const transformedData = {
          monthlyPurchases: data.monthlySummary.order || [], // 매입 금액
          monthlySales: data.monthlySummary.estimate || [], // 매출 금액
          productSummary: {
            sales: data.productSummary.estimate || {}, // 매출 제품 데이터
            purchases: data.productSummary.order || {}, // 매입 제품 데이터
          },
        };
        setPerformanceData(transformedData);
      } else {
        console.error("Failed to fetch performance data:", data.error);
      }

      setLoading(false);
    };

    if (user?.id) {
      fetchPerformanceData();
    }
  }, [user, year]);

  const commonChartOptions = {
    chart: {
      height: 350,
      toolbar: { show: true },
    },
    xaxis: {
      categories: Array.from({ length: 12 }, (_, i) => `${i + 1}월`), // 월별 데이터
      title: { text: "월" },
    },
    yaxis: {
      title: { text: "단위 :백만" }, // Y축 제목 변경
      labels: {
        formatter: (val: number) => `${(val / 1000000).toLocaleString()}`, // 1만 원 단위로 변환
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `₩ ${val.toLocaleString()}`, // 툴팁 포맷
      },
    },
    legend: { show: true },
  };

  const horizontalBarOptions = {
    chart: {
      type: "bar" as "bar", // "bar" 타입 명시
      stacked: true,
      stackType: "100%" as "100%", // stackType 명시
      toolbar: { show: true },
    },
    plotOptions: {
      bar: {
        horizontal: true, // 가로 막대 그래프
      },
    },
    xaxis: {
      categories: Array.from({ length: 12 }, (_, i) => `${i + 1}월`),
      title: { text: "월" },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `${val}`, // 비율 포맷
      },
      title: { text: "단위: 백만 원" }, // 단위 명시
    },
    tooltip: {
      y: {
        formatter: (val: number) => `₩ ${val.toLocaleString()}`, // 숫자 포맷
      },
    },
    legend: { show: true },
  };

  const purchaseChartSeries = [
    {
      name: "월별 매입 금액",
      data: performanceData?.monthlyPurchases || [],
    },
  ];

  const salesChartSeries = [
    {
      name: "월별 매출 금액",
      data: performanceData?.monthlySales || [],
    },
  ];

  const salesProductChartSeries =
    performanceData?.productSummary.sales &&
    Object.entries(performanceData.productSummary.sales).map(
      ([product, data]) => ({
        name: product,
        data,
      })
    );

  const purchaseProductChartSeries =
    performanceData?.productSummary.purchases &&
    Object.entries(performanceData.productSummary.purchases).map(
      ([product, data]) => ({
        name: product,
        data,
      })
    );

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full"></div>
      </div>
    );

  return (
    <div className="text-sm text-[#37352F]">
      <p className="mb-4 font-semibold">영업 성과 요약</p>

      <div className="bg-[#FBFBFB] rounded-md border-[1px] px-6 py-4 mb-6">
        <div className="font-semibold text-lg">
          <span className="mr-2">
            {user?.name} {user?.level}님
          </span>
          <select
            value={year}
            onChange={handleYearChange}
            className="p-2 rounded-md mr-2 bg-[#FBFBFB] text-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
          <span>
            년 매입 및 매출 데이터를 확인해 보세요! 📊{" "}
            {parseInt(year) <= 2024 && (
              <span className="text-sm text-red-500">
                2024년 이전의 데이터는 정확하지 않습니다.
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 space-x-4">
        <div>
          <h2 className="font-semibold text-md mb-4">월별 매입 금액</h2>
          <div className="bg-[#FBFBFB] p-6 rounded-lg shadow mb-8">
            <ReactApexChart
              options={{
                ...commonChartOptions,
                colors: ["#FF5733"],
              }}
              series={purchaseChartSeries}
              type="area"
              height={350}
            />
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-md mb-4">
            매입 제품별 월별 데이터
          </h2>
          <div className="bg-[#FBFBFB] p-6 rounded-lg shadow mb-8">
            <ReactApexChart
              options={{
                ...horizontalBarOptions,
                colors: ["#9467bd", "#8c564b", "#e377c2", "#7f7f7f"],
              }}
              series={purchaseProductChartSeries}
              type="bar"
              height={350}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 space-x-4">
        <div>
          <h2 className="font-semibold text-md mb-4">월별 매출 금액</h2>
          <div className="bg-[#FBFBFB] p-6 rounded-lg shadow mb-8">
            <ReactApexChart
              options={{
                ...commonChartOptions,
                colors: ["#28B463"],
              }}
              series={salesChartSeries}
              type="area"
              height={350}
            />
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-md mb-4">
            매출 제품별 월별 데이터
          </h2>
          <div className="bg-[#FBFBFB] p-6 rounded-lg shadow mb-8">
            <ReactApexChart
              options={{
                ...horizontalBarOptions,
                colors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728"],
              }}
              series={salesProductChartSeries}
              type="bar"
              height={350}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformancePage;
