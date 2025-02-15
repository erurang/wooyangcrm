"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useLoginUser } from "@/context/login";
import dynamic from "next/dynamic";
import CircularProgress from "@mui/material/CircularProgress"; // ✅ MUI 로딩 스피너 추가

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface AnalysisData {
  companyName: string;
  availableYears: number[];
  yearlyData: Record<number, Record<string, number>>;
  productData: Record<number, Record<string, number>>;
  transactionData: Record<number, Record<string, number>>;
  transactionSummary: any;
}

const PerformanceDetailPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { companyId } = useParams();
  const user = useLoginUser();
  const type = searchParams.get("type");

  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const currentYear = new Date().getFullYear();
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);

  const fetchData = async (years: number[]) => {
    setLoading(true);
    try {
      const yearQuery = years.map((y) => `year=${y}`).join("&"); // ✅ 선택된 연도들을 쿼리로 변환
      const res = await fetch(
        `/api/reports/performance/details/${companyId}?type=${type}&userId=${user?.id}&${yearQuery}`
      );
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (companyId && type && user) {
      fetchData(selectedYears);
    }
  }, [companyId, type, user]);

  const isEmptyData =
    !data ||
    !data.yearlyData ||
    Object.keys(data.yearlyData).length === 0 ||
    data.availableYears.length === 0;

  if (isEmptyData)
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p className="text-lg font-semibold">📉 표시할 데이터가 없어요.</p>
        <p className="text-sm">해당 회사의 영업 기록이 없습니다.</p>
        <button
          onClick={() => router.back()} // ✅ 뒤로가기 기능 추가
          className="px-4 py-2 rounded-md text-black"
        >
          뒤로가기
        </button>
      </div>
    );

  // ✅ 연도 선택 토글 (현재 연도 해제 불가능)
  const toggleYearSelection = (year: number) => {
    setSelectedYears((prev) => {
      if (year === currentYear) return prev;
      const updatedYears = prev.includes(year)
        ? prev.filter((y) => y !== year)
        : [...prev, year];

      fetchData(updatedYears); // ✅ 연도 변경 시 API 재요청
      return updatedYears;
    });
  };

  const productNames = Array.from(
    new Set(
      selectedYears.flatMap((year) => Object.keys(data.productData[year] || {}))
    )
  );

  // ✅ 연도 정렬 (CurrentYear을 마지막으로)
  const sortedYears = [...selectedYears].sort((a, b) => {
    if (a === currentYear) return 1;
    if (b === currentYear) return -1;
    return a - b;
  });

  // ✅ 품목별 매출 비율 (Stacked Column Chart)
  const stackedProductSeries = productNames.map((product) => ({
    name: product,
    data: sortedYears.map((year) => {
      const totalSales = Object.values(data.productData[year] || {}).reduce(
        (acc, cur) => acc + cur,
        0
      );
      return totalSales > 0
        ? Math.round(
            ((data.productData[year]?.[product] || 0) / totalSales) * 100
          )
        : 0;
    }),
  }));

  // ✅ 거래 횟수 추이 (Bar Chart)
  const transactionFrequencySeries = sortedYears.map((year) => ({
    name: `${year}년`,
    data: Array.from({ length: 12 }, (_, i) => {
      const month = `${year}-${String(i + 1).padStart(2, "0")}`;
      return data.yearlyData?.[year]?.[month] > 0 ? 1 : 0;
    }),
  })); // ✅ 평균 거래 금액 계산

  // ✅ 연도별 성장률 계산
  const minYear = Math.min(...data.availableYears, currentYear);
  const maxYear = Math.max(...data.availableYears, currentYear);

  const allYears = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i
  );

  // ✅ 모든 연도에 대해 매출 데이터 정리 (비어 있는 연도는 0으로 채우기)
  const yearlySales: number[] = allYears.map((year) =>
    Object.values(data.yearlyData[year] || {}).reduce(
      (sum, value) => sum + value,
      0
    )
  );

  // ✅ 증가율을 정확한 연도에 매칭
  let lastValidSales: number | null = null;
  const yearlyGrowthRates: { year: number; growth: number }[] = [];
  allYears.forEach((year, index) => {
    const sales = yearlySales[index];

    if (sales === 0) {
      yearlyGrowthRates.push({ year, growth: 0 }); // 0원일 경우 증가율 0%
      return;
    }

    if (lastValidSales !== null) {
      const growth = ((sales - lastValidSales) / lastValidSales) * 100;
      yearlyGrowthRates.push({ year, growth: Math.round(growth * 100) / 100 });
    } else {
      yearlyGrowthRates.push({ year, growth: 0 });
    }

    lastValidSales = sales; // 마지막 유효 매출 업데이트
  });

  const transactionCountSeries = sortedYears.map((year) => {
    const transactionCounts = Object.values(
      data.yearlyData?.[year] || {}
    ).filter((count) => count > 0)?.length; // ✅ 거래가 발생한 달 수를 카운팅
    return transactionCounts;
  });

  const totalSalesSeries = sortedYears.map(
    (year) =>
      Object.values(data.yearlyData[year] || {}).reduce(
        (acc, cur) => acc + cur,
        0
      ) || 0
  );

  return (
    <div className="text-sm text-[#37352F]">
      <div className="mb-4">
        {type === "estimate" ? (
          <span
            className="cursor-pointer text-blue-500 hover:font-bold"
            onClick={() =>
              router.push("/reports/performance/details?type=estimate")
            }
          >
            매출 분석
          </span>
        ) : (
          <span
            className="cursor-pointer text-blue-500 hover:font-bold"
            onClick={() =>
              router.push("/reports/performance/details?type=order")
            }
          >
            매입 분석
          </span>
        )}{" "}
        - <span className="font-bold">{data.companyName}</span>
      </div>

      {/* ✅ 연도 선택 체크박스 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[...new Set([...data.availableYears, currentYear])].map((year) => (
          <label key={year} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedYears.includes(year)}
              onChange={() => toggleYearSelection(year)}
            />
            <span
              className={year === currentYear ? "font-bold text-blue-600" : ""}
            >
              {year}
            </span>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* 📌 월별 매출 추이 */}
        <div className="mt-6 bg-[#FBFBFB] p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold">
            월별 {type === "estimate" ? "매출" : "매입"}추이
          </h2>
          <ReactApexChart
            type="area"
            series={selectedYears.map((year) => ({
              name: `${year}년`,
              data: Object.entries(data.yearlyData[year] || {})
                .sort(
                  ([a], [b]) =>
                    parseInt(a.split("-")[1]) - parseInt(b.split("-")[1])
                ) // ✅ 개월 기준 정렬
                .map(([, amount]) => amount),
            }))}
            options={{
              xaxis: {
                categories: Object.keys(data.yearlyData[currentYear] || {})
                  .map((val) => val.split("-")[1].replace(/^0/, "")) // ✅ "02" → "2"
                  .sort((a, b) => parseInt(a) - parseInt(b)), // ✅ 개월 순서로 정렬
                labels: {
                  formatter: (val) => `${val}`, // ✅ 숫자로 출력
                },
              },
              yaxis: {
                labels: {
                  formatter: (val) =>
                    typeof val === "number" ? val.toLocaleString() : "0", // ✅ 천 단위 콤마 추가
                },
              },
              dataLabels: {
                enabled: true,
                formatter: (val) =>
                  typeof val === "number" ? val.toLocaleString() : "0", // ✅ 데이터 라벨에도 천 단위 콤마 추가
              },
              legend: { position: "top" },
            }}
            height={300}
          />
        </div>

        {/* 📌 품목별 매출 비율 */}
        <div className="mt-6 bg-[#FBFBFB] p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold">
            품목별 {type === "estimate" ? "매출" : "매입"} 비율
          </h2>
          <ReactApexChart
            type="bar"
            series={stackedProductSeries}
            options={{
              chart: { stacked: true, stackType: "100%" },
              xaxis: { categories: sortedYears.map((year) => `${year}년`) },
              yaxis: {
                max: 100,
                labels: { formatter: (val) => `${Math.round(val)}%` },
              },
            }}
            height={350}
          />
        </div>

        {/* 📌 거래 빈도 분석 */}
        <div className="mt-6 bg-[#FBFBFB] p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold">거래 빈도 분석</h2>
          <ReactApexChart
            type="bar"
            series={transactionFrequencySeries}
            options={{
              xaxis: {
                categories: Array.from({ length: 12 }, (_, i) => `${i + 1}월`),
              },
              yaxis: {
                // title: { text: "거래 횟수" },
                min: 0,
                forceNiceScale: true, // 자동으로 보기 좋게 조정
                labels: {
                  formatter: (val) => Math.round(val).toString(), // 정수로 변환
                },
              },
            }}
            height={300}
          />
        </div>

        {/* 📌 평균 거래 금액 */}
        <div className="mt-6 bg-[#FBFBFB] p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold">
            거래 횟수 대비 총 {type === "estimate" ? "매출" : "매입"} 추이
          </h2>

          <ReactApexChart
            type="area"
            series={[
              {
                name: "총 매출 (₩)",
                type: "line",
                data: totalSalesSeries, // ✅ 연도별 총 매출 데이터 사용
              },
              {
                name: "거래 횟수 (건)",
                type: "column",
                data: transactionCountSeries, // ✅ 연도별 거래 횟수 데이터 사용
              },
            ]}
            options={{
              chart: { stacked: false },
              stroke: { width: [3, 0] }, // 선(Line)과 막대(Bar) 두께 설정
              xaxis: {
                categories: sortedYears.map((year) => `${year}년`),
              },
              yaxis: [
                {
                  // title: { text: "총 매출 (₩)" },
                  labels: { formatter: (val) => `${val.toLocaleString()}₩` },
                },
                {
                  opposite: true,
                  // title: { text: "거래 횟수 (건)" },
                },
              ],
              tooltip: {
                shared: true,
                y: { formatter: (val) => `${val.toLocaleString()}₩` },
              },
              dataLabels: {
                enabled: true,
                formatter: (val) =>
                  typeof val === "number" ? val.toLocaleString() : "0", // ✅ 데이터 라벨에도 천 단위 콤마 추가
              },
            }}
            height={350}
          />
        </div>

        {/* 📌 연도별 성장률 차트 */}
        <div className="mt-6 bg-[#FBFBFB] p-4 shadow rounded-lg">
          <h2 className="text-lg font-semibold">
            연도별 {type === "estimate" ? "매출" : "매입"} 증가율
          </h2>
          <ReactApexChart
            type="area"
            series={[
              {
                name: `${type === "estimate" ? "매출" : "매입"} 증가율 (%)`,
                data: yearlyGrowthRates.map((item) => item.growth),
              },
            ]}
            options={{
              chart: { toolbar: { show: false } },
              xaxis: {
                categories: yearlyGrowthRates.map((item) => `${item.year}년`),
              },
              yaxis: {
                title: { text: "성장률 (%)" },
                labels: { formatter: (val) => `${val}%` },
              },
              tooltip: { y: { formatter: (val) => `${val}%` } },
            }}
            height={300}
          />
        </div>
        {type === "estimate" && (
          <div className="mt-6 bg-[#FBFBFB] p-4 shadow rounded-lg">
            <h2 className="text-lg font-semibold">잠재고객</h2>
            <ReactApexChart
              type="bar"
              series={[
                {
                  name: "완료된 거래 (건)",
                  type: "column",
                  data: sortedYears.map(
                    (year) =>
                      data.transactionSummary[year]?.completed.count || 0
                  ),
                },
                {
                  name: "진행 중 거래 (건)",
                  type: "column",
                  data: sortedYears.map(
                    (year) => data.transactionSummary[year]?.pending.count || 0
                  ),
                },
                {
                  name: "취소된 거래 (건)",
                  type: "column",
                  data: sortedYears.map(
                    (year) => data.transactionSummary[year]?.canceled.count || 0
                  ),
                },
                {
                  name: "완료된 거래 매출 (₩)",
                  type: "line",
                  data: sortedYears.map(
                    (year) =>
                      data.transactionSummary[year]?.completed.totalSales || 0
                  ),
                },
                {
                  name: "진행 중 거래 매출 (₩)",
                  type: "line",
                  data: sortedYears.map(
                    (year) =>
                      data.transactionSummary[year]?.pending.totalSales || 0
                  ),
                },
                {
                  name: "취소된 거래 매출 (₩)",
                  type: "line",
                  data: sortedYears.map(
                    (year) =>
                      data.transactionSummary[year]?.canceled.totalSales || 0
                  ),
                },
              ]}
              options={{
                chart: {
                  stacked: false, // ✅ 스택 비활성화
                  toolbar: { show: false },
                },

                stroke: { width: [0, 0, 0, 3, 3, 3] },
                xaxis: { categories: sortedYears.map((year) => `${year}년`) },
                yaxis: [
                  {
                    title: { text: "거래 횟수 (건)" },
                    labels: { formatter: (val) => `${val.toLocaleString()}건` },
                  },
                  {
                    opposite: true,
                    title: { text: "매출 (₩)" },
                    labels: { formatter: (val) => `${val.toLocaleString()}₩` },
                  },
                ],
                tooltip: {
                  shared: true,
                  intersect: false,
                  y: { formatter: (val) => `${val.toLocaleString()}₩` },
                },
                colors: [
                  "#008FFB",
                  "#00E396",
                  "#FF4560",
                  "#FF9800",
                  "#775DD0",
                  "#546E7A",
                ],
              }}
              height={400}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDetailPage;
