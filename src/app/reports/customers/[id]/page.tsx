"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

import { CircularProgress } from "@mui/material";
import Link from "next/link";
import { useCompanySalesSummaryDetail } from "@/hooks/reports/customers/useCompanySalesSummaryDetail";
import { useCompanyDetails } from "@/hooks/consultations/useCompanyDetails";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function CompanyDetailPage() {
  const { id } = useParams();
  const companyId = Array.isArray(id) ? id[0] : id || "";

  // ✅ 필터 상태 추가
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

  // ✅ 데이터 가져오기
  const { companyDetail: company, isLoading: isCompanyLoading } =
    useCompanyDetails(companyId);
  const { companySalesSummary, isLoading, isError } =
    useCompanySalesSummaryDetail(companyId, startDate, endDate);

  // ✅ 차트 데이터 정리
  const getChartData = (items: any[]) => {
    const sorted = [...items].sort((a, b) => b.total - a.total);
    const top5 = sorted.slice(0, 5);
    const otherTotal = sorted.slice(5).reduce((sum, c) => sum + c.total, 0);

    return {
      labels: [...top5.map((c) => c.name), otherTotal > 0 ? "기타" : ""].filter(
        Boolean
      ),
      data: [
        ...top5.map((c) => c.total),
        otherTotal > 0 ? otherTotal : 0,
      ].filter((v) => v > 0),
    };
  };

  // ✅ 차트 데이터 생성
  const salesChart = getChartData(companySalesSummary?.sales_items || []);
  const purchaseChart = getChartData(companySalesSummary?.purchase_items || []);

  // ✅ 영업사원별 매출/매입 차트 데이터 변환 함수
  const getUserChartData = (
    users: any[],
    key: "total_sales" | "total_purchases"
  ) => {
    return {
      categories: users.map((u) => u.user_name), // X축 (사용자 이름)
      data: users.map((u) => u[key]), // Y축 (총 매출 또는 매입 금액)
    };
  };

  // ✅ 영업사원별 매출 차트 데이터 생성
  const salesByUserChart = getUserChartData(
    companySalesSummary?.sales_by_users || [],
    "total_sales"
  );

  // ✅ 영업사원별 매입 차트 데이터 생성
  const purchaseByUserChart = getUserChartData(
    companySalesSummary?.purchases_by_users || [],
    "total_purchases"
  );

  //

  return (
    <div className="text-sm text-[#333]">
      <div className="mb-4">
        <Link
          href="/reports/customers"
          className="text-blue-500 hover:font-semibold"
        >
          거래처 목록{" "}
        </Link>
        <span className="text-[#333] font-semibold">- {company?.name}</span>
      </div>

      {/* 🔹 거래처 정보 섹션 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#FBFBFB] rounded-md border px-6 py-6 shadow-sm">
          <p className="text-xl font-bold text-gray-800">{company?.name}</p>
          <p className="text-gray-600 text-sm mt-1">
            총 매출:{" "}
            <span className="font-semibold text-blue-600">
              {companySalesSummary?.total_sales?.toLocaleString() || 0} 원
            </span>
          </p>
          <p className="text-gray-600 text-sm mt-1">
            총 매입:{" "}
            <span className="font-semibold text-green-600">
              {companySalesSummary?.total_purchases?.toLocaleString() || 0} 원
            </span>
          </p>
        </div>

        <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
          <p className="text-lg font-semibold text-gray-700 ">
            📅 데이터 기간 선택
          </p>
          <div className="grid grid-cols-3 gap-4 mt-2">
            {/* 🔹 연도 선택 */}
            <select
              className="border-2 border-blue-400 p-2 rounded-md text-gray-700 w-full"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
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

            {/* 🔹 필터 선택 */}
            <select
              className="border p-2 rounded-md w-full"
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value as "year" | "quarter" | "month")
              }
            >
              <option value="year">연도별</option>
              <option value="quarter">분기별</option>
              <option value="month">월별</option>
            </select>

            {/* 🔹 분기 선택 */}
            {dateFilter === "quarter" && (
              <select
                className="border p-2 rounded-md w-full"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
              >
                <option value="1">1분기 (1~3월)</option>
                <option value="2">2분기 (4~6월)</option>
                <option value="3">3분기 (7~9월)</option>
                <option value="4">4분기 (10~12월)</option>
              </select>
            )}

            {/* 🔹 월 선택 */}
            {dateFilter === "month" && (
              <select
                className="border p-2 rounded-md w-full"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
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
      </div>

      {/* 🔹 차트 (거래처별 매출 & 매입) */}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
          <p className="text-lg font-semibold mb-4">📈 매출 품목 비중</p>
          <ReactApexChart
            options={{
              labels: salesChart.labels,
              legend: { position: "bottom" },
              yaxis: {
                labels: {
                  formatter: (value: number) => value.toLocaleString(), // ✅ 콤마 추가
                },
              },
            }}
            series={salesChart.data}
            type="pie"
            height={300}
          />
        </div>
        <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
          <p className="text-lg font-semibold mb-4">📈 매입 품목 비중</p>
          <ReactApexChart
            options={{
              labels: purchaseChart.labels,
              legend: { position: "bottom" },
              yaxis: {
                labels: {
                  formatter: (value: number) => value.toLocaleString(), // ✅ 콤마 추가
                },
              },
            }}
            series={purchaseChart.data}
            type="pie"
            height={300}
          />
        </div>

        <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
          <p className="text-lg font-semibold mb-4">👤 영업사원별 매출</p>
          {salesByUserChart.data?.length > 0 ? (
            <ReactApexChart
              options={{
                chart: { type: "bar" },
                xaxis: { categories: salesByUserChart.categories }, // ✅ 영업사원 이름 표시
                yaxis: {
                  labels: {
                    formatter: (value: number) => value.toLocaleString(), // ✅ 천 단위 콤마 추가
                    style: { colors: "#333", fontSize: "14px" }, // ✅ Y축 글씨 색상
                  },
                },
                plotOptions: {
                  bar: { horizontal: true },
                },
                dataLabels: {
                  enabled: true,
                  formatter: (val: number) => val.toLocaleString(), // ✅ 데이터 라벨 콤마 추가
                  style: { colors: ["#333"], fontSize: "12px" }, // ✅ 바 내부 글씨 색상
                },
              }}
              series={[{ name: "총 매출", data: salesByUserChart.data }]}
              type="bar"
              height={300}
            />
          ) : (
            <p className="text-gray-500">매출 데이터 없음</p>
          )}
        </div>

        {/* 🔹 영업사원별 매입 차트 */}
        <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
          <p className="text-lg font-semibold mb-4">👤 영업사원별 매입</p>
          {purchaseByUserChart.data?.length > 0 ? (
            <ReactApexChart
              options={{
                chart: { type: "bar" },
                xaxis: { categories: purchaseByUserChart.categories }, // ✅ 영업사원 이름 표시
                yaxis: {
                  labels: {
                    formatter: (value: number) => value.toLocaleString(), // ✅ 천 단위 콤마 추가
                    style: { colors: "#333", fontSize: "14px" }, // ✅ Y축 글씨 색상
                  },
                },
                plotOptions: {
                  bar: { horizontal: true },
                },
                dataLabels: {
                  enabled: true,
                  formatter: (val: number) => val.toLocaleString(), // ✅ 데이터 라벨 콤마 추가
                  style: { colors: ["#333"], fontSize: "12px" }, // ✅ 바 내부 글씨 색상
                },
              }}
              series={[{ name: "총 매입", data: purchaseByUserChart.data }]}
              type="bar"
              height={300}
            />
          ) : (
            <p className="text-gray-500">매입 데이터 없음</p>
          )}
        </div>

        <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
          <p className="text-lg font-semibold mb-2">📦 매출 품목</p>
          {companySalesSummary?.sales_items?.length > 0 ? (
            companySalesSummary?.sales_items.map((item: any, idx: number) => (
              <p key={idx} className="border-b py-2">
                {item.name} ({item.spec}): {item.quantity}개 -{" "}
                {item.total.toLocaleString()}원
              </p>
            ))
          ) : (
            <p className="text-gray-500">매출 품목 없음</p>
          )}
        </div>
        <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
          <p className="text-lg font-semibold mb-2">📦 매입 품목</p>
          {companySalesSummary?.purchase_items?.length > 0 ? (
            companySalesSummary?.purchase_items.map(
              (item: any, idx: number) => (
                <p key={idx} className="border-b py-2">
                  {item.name} ({item.spec}): {item.quantity}개 -{" "}
                  {item.total.toLocaleString()}원
                </p>
              )
            )
          ) : (
            <p className="text-gray-500">매입 품목 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}
