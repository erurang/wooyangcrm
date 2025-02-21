"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { useUserDetail } from "@/hooks/useUserDetail";
import { useUserSalesSummary } from "@/hooks/reports/useUserSalesSummary";
import { useUserTransactions } from "@/hooks/reports/userDetail/useUserTransactions";
import Link from "next/link";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function UserDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const userId = Array.isArray(id) ? id[0] : id || "";

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
  const [searchCompany, setSearchCompany] = useState(""); // 거래처 검색
  const [searchProduct, setSearchProduct] = useState(""); // 품목 검색

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
  const { user, isLoading: isUserLoading } = useUserDetail(userId);
  const { salesSummary, isLoading: isSalesLoading } = useUserSalesSummary(
    [userId],
    startDate,
    endDate
  );
  const {
    salesCompanies,
    purchaseCompanies,
    salesProducts,
    purchaseProducts,
    isLoading: isTransactionsLoading,
  } = useUserTransactions(userId, startDate, endDate);

  //

  // ✅ 검색 필터링
  const filteredSalesCompanies = salesCompanies.filter((c: any) =>
    c.name.toLowerCase().includes(searchCompany.toLowerCase())
  );

  const filteredPurchaseCompanies = purchaseCompanies.filter((c: any) =>
    c.name.toLowerCase().includes(searchCompany.toLowerCase())
  );

  const filteredSalesProducts = salesProducts.filter((p: any) =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const filteredPurchaseProducts = purchaseProducts.filter((p: any) =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase())
  );
  //

  // ✅ 중복 제거 및 총합 계산 함수
  const aggregateData = (data: any[], key: string) => {
    return Object.values(
      data.reduce((acc: any, item: any) => {
        const identifier = `${item.name}-${item[key] || ""}`; // 거래처명 or 품목명+스펙
        if (!acc[identifier]) {
          acc[identifier] = { ...item };
        } else {
          acc[identifier].total += item.total; // 같은 항목이면 total 값 합산
        }
        return acc;
      }, {})
    );
  };

  // ✅ 중복 데이터 제거 및 총합 계산 적용
  const aggregatedSalesCompanies = aggregateData(salesCompanies, "name");
  const aggregatedPurchaseCompanies = aggregateData(purchaseCompanies, "name");
  const aggregatedSalesProducts = aggregateData(salesProducts, "spec");
  const aggregatedPurchaseProducts = aggregateData(purchaseProducts, "spec");

  // ✅ 차트 데이터 정리
  const getChartData = (companies: any[]) => {
    const sorted = [...companies].sort((a, b) => b.total - a.total);
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
  const salesChart = getChartData(aggregatedSalesCompanies);
  const purchaseChart = getChartData(aggregatedPurchaseCompanies);

  return (
    <div className="text-sm text-[#333]">
      {/* 🔹 유저 기본 정보 + 견적/매출 실적 */}
      <div className="mb-4">
        <Link
          href="/customers"
          className="text-blue-500 hover:underline hover:font-bold"
        >
          직원 목록
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <p className="text-xl font-bold">
          {user?.name} ({user?.position})
        </p>
        <p className="text-gray-600">📧 {user?.email || "-"}</p>
        <p className="text-gray-600">
          🎯 목표 금액:{" "}
          <span className="font-semibold text-blue-600">
            {user?.target?.toLocaleString() || "-"} 원
          </span>
        </p>

        {/* 🔹 필터 옵션 */}
        <div className="flex flex-wrap justify-between items-center mt-4">
          <p className="font-semibold text-lg">📅 데이터 기간 선택</p>
          <div className="flex space-x-4">
            {/* 🔹 연도 선택 */}
            <select
              className="border p-2 rounded-md"
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
              className="border p-2 rounded-md"
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
                className="border p-2 rounded-md"
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
                className="border p-2 rounded-md"
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

      {/* 🔹 차트 (견적 & 발주 실적) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <p className="text-lg font-semibold mb-4">🏢 거래처별 매출 비중</p>
          {/* 🔹 매출 차트 */}
          <ReactApexChart
            options={{
              labels: salesChart.labels,
              legend: { position: "bottom" },
            }}
            series={salesChart.data}
            type="pie"
            height={300}
          />
        </div>
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <p className="text-lg font-semibold mb-4">🏢 거래처별 매입 비중</p>
          <ReactApexChart
            options={{
              labels: purchaseChart.labels,
              legend: { position: "bottom" },
            }}
            series={purchaseChart.data}
            type="pie"
            height={300}
          />
        </div>

        {/* 🟦 견적 실적 (Area Chart) */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <p className="text-lg font-semibold mb-4">📈 견적 금액</p>
          <ReactApexChart
            options={{
              chart: { type: "area" },
              xaxis: {
                categories: ["진행 중", "완료", "취소"], // X축: 진행 중, 완료, 취소
              },
              yaxis: {
                labels: {
                  formatter: (value) => value.toLocaleString(), // 숫자 천 단위 콤마 적용
                },
              },
              stroke: {
                curve: "smooth", // 부드러운 곡선
              },
              dataLabels: {
                enabled: true,
                formatter: (value) => value.toLocaleString(),
              },
              colors: ["#3498db", "#2ecc71", "#e74c3c"], // 진행 중(파랑), 완료(초록), 취소(빨강)
            }}
            series={[
              {
                name: "견적 실적",
                data: [
                  salesSummary?.[userId]?.estimates?.pending || 0, // 진행 중
                  salesSummary?.[userId]?.estimates?.completed || 0, // 완료
                  salesSummary?.[userId]?.estimates?.canceled || 0, // 취소
                ],
              },
            ]}
            type="area"
            height={300}
          />
        </div>

        {/* 🟩 발주 실적 (Area Chart) */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <p className="text-lg font-semibold mb-4">📈 발주 금액</p>
          <ReactApexChart
            options={{
              chart: { type: "area" },
              xaxis: {
                categories: ["진행 중", "완료", "취소"], // X축: 진행 중, 완료, 취소
              },
              yaxis: {
                labels: {
                  formatter: (value) => value.toLocaleString(), // 숫자 천 단위 콤마 적용
                },
              },
              stroke: {
                curve: "smooth", // 부드러운 곡선
              },
              dataLabels: {
                enabled: true,
                formatter: (value) => value.toLocaleString(),
              },
              colors: ["#1abc9c", "#f39c12", "#e74c3c"], // 진행 중(초록), 완료(노랑), 취소(빨강)
            }}
            series={[
              {
                name: "발주 실적",
                data: [
                  salesSummary?.[userId]?.orders?.pending || 0, // 진행 중
                  salesSummary?.[userId]?.orders?.completed || 0, // 완료
                  salesSummary?.[userId]?.orders?.canceled || 0, // 취소
                ],
              },
            ]}
            type="area"
            height={300}
          />
        </div>
      </div>

      {/* 🔹 거래처 & 품목 테이블 */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* 🔹 매출 거래처 목록 */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-lg font-semibold mb-2">🏢 매출 거래처</p>
          {aggregatedSalesCompanies.length > 0 ? (
            aggregatedSalesCompanies.map((c: any) => (
              <p key={c.name} className="border-b py-2">
                {c.name} - {c.total.toLocaleString()} 원
              </p>
            ))
          ) : (
            <p className="text-gray-500">매출 거래처 없음</p>
          )}
        </div>

        {/* 🔹 매입 거래처 목록 */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-lg font-semibold mb-2">🏢 매입 거래처</p>
          {aggregatedPurchaseCompanies.length > 0 ? (
            aggregatedPurchaseCompanies.map((c: any) => (
              <p key={c.name} className="border-b py-2">
                {c.name} - {c.total.toLocaleString()} 원
              </p>
            ))
          ) : (
            <p className="text-gray-500">매입 거래처 없음</p>
          )}
        </div>
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-lg font-semibold mb-2">📦 매출 품목</p>
          {aggregatedSalesProducts.length > 0 ? (
            aggregatedSalesProducts.map((p: any) => (
              <p key={`${p.name}-${p.spec}`} className="border-b py-2">
                {p.name} ({p.spec}) {p.quantity}- {p.total.toLocaleString()} 원
              </p>
            ))
          ) : (
            <p className="text-gray-500">매출 품목 없음</p>
          )}
        </div>

        {/* 🔹 매입 품목 목록 */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-lg font-semibold mb-2">📦 매입 품목</p>
          {aggregatedPurchaseProducts.length > 0 ? (
            aggregatedPurchaseProducts.map((p: any) => (
              <p key={`${p.name}-${p.spec}`} className="border-b py-2">
                {p.name} ({p.spec}) {p.quantity}- {p.total.toLocaleString()} 원
              </p>
            ))
          ) : (
            <p className="text-gray-500">매입 품목 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}
