"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { useUserDetail } from "@/hooks/useUserDetail";
import { useUserSalesSummary } from "@/hooks/reports/useUserSalesSummary";
import { useUserTransactions } from "@/hooks/reports/userDetail/useUserTransactions";
import Link from "next/link";
import { useUserDocumentsCount } from "@/hooks/reports/useUserDocumentsCount";
import { useUserDocumentList } from "@/hooks/reports/userDetail/documents/useUserDocumentList";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function UserDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const userId = Array.isArray(id) ? id[0] : id || "";

  const [activeTab, setActiveTab] = useState<
    "consultation" | "sales" | "purchase"
  >("consultation");

  // ✅ 필터 상태 추가
  const [dateFilter, setDateFilter] = useState<"year" | "quarter" | "month">(
    "month"
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

  // swr
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

  const { documents, isLoading: isConsultationsLoading } =
    useUserDocumentsCount([userId], startDate, endDate);

  const { documentsDetails } = useUserDocumentList(userId, startDate, endDate);

  //

  const userDocuments = documents?.[userId] || {
    estimates: { pending: 0, completed: 0, canceled: 0, total: 0 },
    orders: { pending: 0, completed: 0, canceled: 0, total: 0 },
  };

  const estimates = userDocuments.estimates;
  const orders = userDocuments.orders;

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

  const completedSales: any = (documentsDetails ?? [])
    ?.flatMap((user: any) => user.consultations ?? [])
    ?.flatMap((consultation: any) => consultation.documents ?? [])
    ?.filter(
      (doc: any) => doc.status === "completed" && doc.type === "estimate"
    )
    ?.reduce(
      (sum: any, doc: any) =>
        sum +
        (doc.items ?? []).reduce(
          (subSum: any, item: any) => subSum + (item.amount ?? 0),
          0
        ),
      0
    );

  const completedPurchases: any = (documentsDetails ?? [])
    ?.flatMap((user: any) => user.consultations ?? [])
    ?.flatMap((consultation: any) => consultation.documents ?? [])
    ?.filter((doc: any) => doc.status === "completed" && doc.type === "order")
    ?.reduce(
      (sum: any, doc: any) =>
        sum +
        (doc.items ?? []).reduce(
          (subSum: any, item: any) => subSum + (item.amount ?? 0),
          0
        ),
      0
    );

  const pendingSales: any = (documentsDetails ?? [])
    .flatMap((user: any) => user.consultations ?? [])
    .flatMap((consultation: any) => consultation.documents ?? [])
    .filter((doc: any) => doc.status === "pending" && doc.type === "estimate")
    .reduce(
      (sum: any, doc: any) =>
        sum +
        (doc.items ?? []).reduce(
          (subSum: any, item: any) => subSum + (item.amount ?? 0),
          0
        ),
      0
    );

  const pendingPurchases: any = (documentsDetails ?? [])
    .flatMap((user: any) => user.consultations ?? [])
    .flatMap((consultation: any) => consultation.documents ?? [])
    .filter((doc: any) => doc.status === "pending" && doc.type === "order")
    .reduce(
      (sum: any, doc: any) =>
        sum +
        (doc.items ?? []).reduce(
          (subSum: any, item: any) => subSum + (item.amount ?? 0),
          0
        ),
      0
    );

  const canceledSales: any = (documentsDetails ?? [])
    .flatMap((user: any) => user.consultations ?? [])
    .flatMap((consultation: any) => consultation.documents ?? [])
    .filter((doc: any) => doc.status === "canceled" && doc.type === "estimate")
    .reduce(
      (sum: any, doc: any) =>
        sum +
        (doc.items ?? []).reduce(
          (subSum: any, item: any) => subSum + (item.amount ?? 0),
          0
        ),
      0
    );

  const canceledPurchases: any = (documentsDetails ?? [])
    .flatMap((user: any) => user.consultations ?? [])
    .flatMap((consultation: any) => consultation.documents ?? [])
    .filter((doc: any) => doc.status === "canceled" && doc.type === "order")
    .reduce(
      (sum: any, doc: any) =>
        sum +
        (doc.items ?? []).reduce(
          (subSum: any, item: any) => subSum + (item.amount ?? 0),
          0
        ),
      0
    );

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "진행 중";
      case "completed":
        return "완료됨";
      case "canceled":
        return "취소됨";
      default:
        return "알 수 없음";
    }
  };

  // 🔹 매출 거래처 Bar 차트 (aggregatedSalesCompanies)
  const barCategories = aggregatedSalesCompanies.map((c: any) => c.name);
  const barSeriesData = aggregatedSalesCompanies.map((c: any) => c.total);

  const barOptions = {
    chart: { type: "bar" as const },
    xaxis: { categories: barCategories },
    yaxis: {
      labels: {
        formatter: (val: number) => val.toLocaleString(),
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toLocaleString(),
    },
    plotOptions: {
      bar: { borderRadius: 4 },
    },
    fill: { colors: ["#3498db"] },
    title: {
      text: "매출 거래처 (Bar 차트)",
      align: "left" as const,
    },
  };
  const barSeries = [{ name: "매출", data: barSeriesData }];

  return (
    <div className="text-sm text-[#333]">
      <div className="mb-4">
        {/* <Link
          href="/reports/users"
          className="text-blue-500 hover:font-semibold"
        >
          영업 직원 목록{" "}
        </Link> */}
        <span className="text-[#333] font-semibold">영업 기록</span>
      </div>

      {/* 🔹 유저 정보 섹션 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#FBFBFB] rounded-md border px-6 py-6 shadow-sm">
          {/* 🔹 유저 정보 섹션 */}
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <div>
              <p className="text-xl font-bold text-gray-800">
                {user?.name} {user?.level}{" "}
                <span className="text-gray-600">({user?.position})</span>
              </p>
              <p className="text-gray-600 text-sm mt-1">
                🎯 목표 금액:{" "}
                <span className="font-semibold text-blue-600">
                  {user?.target?.toLocaleString() || "-"} 원
                </span>
              </p>
            </div>
            <div className="flex space-x-4 mb-4">
              <button
                className={`px-4 py-2 rounded-md ${
                  activeTab === "consultation"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setActiveTab("consultation")}
              >
                상담내역
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  activeTab === "sales"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setActiveTab("sales")}
              >
                매출
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  activeTab === "purchase"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
                onClick={() => setActiveTab("purchase")}
              >
                매입
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600 mt-2 grid grid-cols-3">
            <p>
              🟢 확정된 매출 -{" "}
              <span className="font-semibold text-gray-800">
                {completedSales.toLocaleString()} 원
              </span>
            </p>
            <p>
              🟢 확정된 매입 -{" "}
              <span className="font-semibold text-gray-800">
                {completedPurchases.toLocaleString()} 원
              </span>
            </p>
            <p>
              🟡 진행 중 매출 -{" "}
              <span className="font-semibold text-gray-800">
                {pendingSales.toLocaleString()} 원
              </span>
            </p>
            <p>
              🟡 진행 중 매입 -{" "}
              <span className="font-semibold text-gray-800">
                {pendingPurchases.toLocaleString()} 원
              </span>
            </p>
            <p>
              🔴 취소된 매출 -{" "}
              <span className="font-semibold text-gray-800">
                {canceledSales.toLocaleString()} 원
              </span>
            </p>
            <p>
              🔴 취소된 매입 -{" "}
              <span className="font-semibold text-gray-800">
                {canceledPurchases.toLocaleString()} 원
              </span>
            </p>
          </div>
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
          <div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* ✅ 견적서 */}
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-md font-semibold">📄 견적서</p>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between text-sm text-yellow-700 font-medium">
                    진행 중{" "}
                    <span className="font-bold text-yellow-600">
                      {estimates.pending}건
                    </span>
                  </li>
                  <li className="flex justify-between text-sm text-green-700 font-medium">
                    완료됨{" "}
                    <span className="font-bold text-green-600">
                      {estimates.completed}건
                    </span>
                  </li>
                  <li className="flex justify-between text-sm text-red-700 font-medium">
                    취소됨{" "}
                    <span className="font-bold text-red-600">
                      {estimates.canceled}건
                    </span>
                  </li>
                </ul>
              </div>

              {/* ✅ 발주서 */}
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-md font-semibold ">📑 발주서</p>
                <ul className="mt-2 space-y-2">
                  <li className="flex justify-between text-sm text-yellow-700 font-medium">
                    진행 중{" "}
                    <span className="font-bold text-yellow-600">
                      {orders.pending}건
                    </span>
                  </li>
                  <li className="flex justify-between text-sm text-green-700 font-medium">
                    완료됨{" "}
                    <span className="font-bold text-green-600">
                      {orders.completed}건
                    </span>
                  </li>
                  <li className="flex justify-between text-sm text-red-700 font-medium">
                    취소됨{" "}
                    <span className="font-bold text-red-600">
                      {orders.canceled}건
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*  */}
      {activeTab === "consultation" && (
        <div className="bg-[#FBFBFB] rounded-md border px-6 py-4 mb-4">
          {/* <h2 className="text-lg font-bold mb-4">상담 내역 & 문서 & 품목</h2> */}

          {/* 🔹 스크롤 가능 영역 */}
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[2fr_1fr_2fr] gap-6 min-w-[900px] text-gray-700 text-lg font-bold">
              <div>상담 기록</div>
              <div>관련 문서</div>
              <div>품목 리스트</div>
            </div>

            {/* 🔹 상담 기록 + 문서 + 품목 */}
            <div className="space-y-4 mt-2 overflow-y-auto max-h-[700px]">
              {documentsDetails?.map((user: any) =>
                user.consultations.map((consultation: any) => (
                  <div
                    key={consultation.consultation_id}
                    className="grid grid-cols-[2fr_1fr_2fr] gap-6 items-center border-b pb-4"
                  >
                    {/* 🔹 상담 기록 */}
                    <div className="p-3 border rounded-md bg-white">
                      <div className="text-sm text-gray-600">
                        {consultation.date}
                        <span
                          className="font-bold ml-2 text-blue-500 cursor-pointer "
                          onClick={() =>
                            router.push(
                              `/consultations/${consultation.company_id}`
                            )
                          }
                        >
                          {consultation.company_name}
                        </span>
                      </div>
                      <p className="text-gray-800 whitespace-pre-line">
                        {consultation.content}
                      </p>
                    </div>

                    {/* 🔹 관련 문서 */}
                    <div className="p-3 border rounded-md bg-white">
                      {consultation.documents.length > 0 ? (
                        consultation.documents.map((doc: any) => (
                          <div
                            key={doc.document_id}
                            className="p-2 border rounded-md bg-gray-50 shadow-sm"
                          >
                            <p className="text-sm font-semibold text-blue-600">
                              {doc.type === "estimate"
                                ? "📄 견적서"
                                : "📑 발주서"}
                              <span className="pl-2">
                                ({getStatusText(doc.status)})
                              </span>
                            </p>
                            <p className="text-xs text-gray-700">
                              문서번호:{" "}
                              <span className="font-semibold">
                                {doc.document_number}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              생성일: {doc.created_at.split("T")[0]}
                            </p>
                            <p className="text-xs">
                              담당자:{" "}
                              <span className="font-semibold">
                                {doc.user.name}
                              </span>{" "}
                              ({doc.user.level})
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm">
                          📂 관련 문서 없음
                        </p>
                      )}
                    </div>

                    {/* 🔹 품목 리스트 */}
                    <div className="p-3 border rounded-md bg-white">
                      {consultation.documents.length > 0 ? (
                        consultation.documents.map((doc: any) =>
                          doc.items.map((item: any, itemIndex: any) => (
                            <div
                              key={itemIndex}
                              className="grid grid-cols-4 gap-4 p-2 border rounded-md bg-gray-50 text-sm"
                            >
                              <span className="text-gray-700">{item.name}</span>
                              <span className="text-gray-500">{item.spec}</span>
                              <span className="text-gray-500">
                                {item.quantity}
                              </span>
                              <span className="text-blue-600 font-semibold">
                                {Number(item.amount).toLocaleString()} 원
                              </span>
                            </div>
                          ))
                        )
                      ) : (
                        <p className="text-gray-400 text-sm">📦 품목 없음</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/*  */}
      {/* 🔹 차트 (견적 & 발주 실적) */}
      {activeTab === "sales" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
            <p className="text-lg font-semibold mb-4">🏢 거래처별 매출 비중</p>
            {/* 🔹 매출 차트 */}
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

          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
            <p className="text-lg font-semibold mb-2">📦 매출 품목</p>
            {aggregatedSalesProducts.length > 0 ? (
              aggregatedSalesProducts.map((p: any) => (
                <p key={`${p.name}-${p.spec}`} className="border-b py-2">
                  {p.name} ({p.spec}) {p.quantity}- {p.total.toLocaleString()}{" "}
                  원
                </p>
              ))
            ) : (
              <p className="text-gray-500">매출 품목 없음</p>
            )}
          </div>

          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
            <p className="text-lg font-semibold mb-2">🏢 매출 거래처</p>
            {/* <ReactApexChart
              options={barOptions}
              series={barSeries}
              type="bar"
              height={300}
            /> */}
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
        </div>
      )}

      {activeTab === "purchase" && (
        <div className="grid grid-cols-2 gap-4 my-4">
          {/* 🔹 매출 거래처 목록 */}

          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
            {" "}
            <p className="text-lg font-semibold mb-4">🏢 거래처별 매입 비중</p>
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

          {/* 🟩 발주 실적 (Area Chart) */}
          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
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

          {/* 🔹 매입 거래처 목록 */}
          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
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

          {/* 🔹 매입 품목 목록 */}
          <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
            <p className="text-lg font-semibold mb-2">📦 매입 품목</p>
            {aggregatedPurchaseProducts.length > 0 ? (
              aggregatedPurchaseProducts.map((p: any) => (
                <p key={`${p.name}-${p.spec}`} className="border-b py-2">
                  {p.name} ({p.spec}) {p.quantity}- {p.total.toLocaleString()}{" "}
                  원
                </p>
              ))
            ) : (
              <p className="text-gray-500">매입 품목 없음</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// "use client";

// import { useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import dynamic from "next/dynamic";

// import { useUserDetail } from "@/hooks/useUserDetail";
// import { useUserSalesSummary } from "@/hooks/reports/useUserSalesSummary";
// import { useUserTransactions } from "@/hooks/reports/userDetail/useUserTransactions";
// import Link from "next/link";
// import { useUserDocumentsCount } from "@/hooks/reports/useUserDocumentsCount";
// import { useUserDocumentList } from "@/hooks/reports/userDetail/documents/useUserDocumentList";

// const ReactApexChart = dynamic(() => import("react-apexcharts"), {
//   ssr: false,
// });

// export default function UserDetailPage() {
//   const router = useRouter();
//   const { id } = useParams();
//   const userId = Array.isArray(id) ? id[0] : id || "";

//   // ✅ 필터 상태 추가
//   const [dateFilter, setDateFilter] = useState<"year" | "quarter" | "month">(
//     "month"
//   );
//   const [selectedYear, setSelectedYear] = useState<number>(
//     new Date().getFullYear()
//   );
//   const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
//   const [selectedMonth, setSelectedMonth] = useState<number>(
//     new Date().getMonth() + 1
//   );

//   // ✅ 날짜 변환 (연도별, 분기별, 월별)
//   let startDate: string;
//   let endDate: string;

//   if (dateFilter === "year") {
//     startDate = `${selectedYear}-01-01`;
//     endDate = `${selectedYear}-12-31`;
//   } else if (dateFilter === "quarter") {
//     startDate = `${selectedYear}-${(selectedQuarter - 1) * 3 + 1}-01`;
//     endDate = new Date(selectedYear, selectedQuarter * 3, 0)
//       .toISOString()
//       .split("T")[0];
//   } else {
//     startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
//     endDate = new Date(selectedYear, selectedMonth, 0)
//       .toISOString()
//       .split("T")[0];
//   }

//   // swr
//   const { user, isLoading: isUserLoading } = useUserDetail(userId);
//   const { salesSummary, isLoading: isSalesLoading } = useUserSalesSummary(
//     [userId],
//     startDate,
//     endDate
//   );
//   const {
//     salesCompanies,
//     purchaseCompanies,
//     salesProducts,
//     purchaseProducts,
//     isLoading: isTransactionsLoading,
//   } = useUserTransactions(userId, startDate, endDate);

//   const { documents, isLoading: isConsultationsLoading } =
//     useUserDocumentsCount([userId], startDate, endDate);

//   const { documentsDetails } = useUserDocumentList(userId, startDate, endDate);

//   //

//   const userDocuments = documents?.[userId] || {
//     estimates: { pending: 0, completed: 0, canceled: 0, total: 0 },
//     orders: { pending: 0, completed: 0, canceled: 0, total: 0 },
//   };

//   const estimates = userDocuments.estimates;
//   const orders = userDocuments.orders;

//   // ✅ 중복 제거 및 총합 계산 함수
//   const aggregateData = (data: any[], key: string) => {
//     return Object.values(
//       data.reduce((acc: any, item: any) => {
//         const identifier = `${item.name}-${item[key] || ""}`; // 거래처명 or 품목명+스펙
//         if (!acc[identifier]) {
//           acc[identifier] = { ...item };
//         } else {
//           acc[identifier].total += item.total; // 같은 항목이면 total 값 합산
//         }
//         return acc;
//       }, {})
//     );
//   };

//   // ✅ 중복 데이터 제거 및 총합 계산 적용
//   const aggregatedSalesCompanies = aggregateData(salesCompanies, "name");
//   const aggregatedPurchaseCompanies = aggregateData(purchaseCompanies, "name");
//   const aggregatedSalesProducts = aggregateData(salesProducts, "spec");
//   const aggregatedPurchaseProducts = aggregateData(purchaseProducts, "spec");

//   // ✅ 차트 데이터 정리
//   const getChartData = (companies: any[]) => {
//     const sorted = [...companies].sort((a, b) => b.total - a.total);
//     const top5 = sorted.slice(0, 5);
//     const otherTotal = sorted.slice(5).reduce((sum, c) => sum + c.total, 0);

//     return {
//       labels: [...top5.map((c) => c.name), otherTotal > 0 ? "기타" : ""].filter(
//         Boolean
//       ),
//       data: [
//         ...top5.map((c) => c.total),
//         otherTotal > 0 ? otherTotal : 0,
//       ].filter((v) => v > 0),
//     };
//   };

//   // ✅ 차트 데이터 생성
//   const salesChart = getChartData(aggregatedSalesCompanies);
//   const purchaseChart = getChartData(aggregatedPurchaseCompanies);

//   const completedSales: any = (documentsDetails ?? [])
//     ?.flatMap((user: any) => user.consultations ?? [])
//     ?.flatMap((consultation: any) => consultation.documents ?? [])
//     ?.filter(
//       (doc: any) => doc.status === "completed" && doc.type === "estimate"
//     )
//     ?.reduce(
//       (sum: any, doc: any) =>
//         sum +
//         (doc.items ?? []).reduce(
//           (subSum: any, item: any) => subSum + (item.amount ?? 0),
//           0
//         ),
//       0
//     );

//   const completedPurchases: any = (documentsDetails ?? [])
//     ?.flatMap((user: any) => user.consultations ?? [])
//     ?.flatMap((consultation: any) => consultation.documents ?? [])
//     ?.filter((doc: any) => doc.status === "completed" && doc.type === "order")
//     ?.reduce(
//       (sum: any, doc: any) =>
//         sum +
//         (doc.items ?? []).reduce(
//           (subSum: any, item: any) => subSum + (item.amount ?? 0),
//           0
//         ),
//       0
//     );

//   const pendingSales: any = (documentsDetails ?? [])
//     .flatMap((user: any) => user.consultations ?? [])
//     .flatMap((consultation: any) => consultation.documents ?? [])
//     .filter((doc: any) => doc.status === "pending" && doc.type === "estimate")
//     .reduce(
//       (sum: any, doc: any) =>
//         sum +
//         (doc.items ?? []).reduce(
//           (subSum: any, item: any) => subSum + (item.amount ?? 0),
//           0
//         ),
//       0
//     );

//   const pendingPurchases: any = (documentsDetails ?? [])
//     .flatMap((user: any) => user.consultations ?? [])
//     .flatMap((consultation: any) => consultation.documents ?? [])
//     .filter((doc: any) => doc.status === "pending" && doc.type === "order")
//     .reduce(
//       (sum: any, doc: any) =>
//         sum +
//         (doc.items ?? []).reduce(
//           (subSum: any, item: any) => subSum + (item.amount ?? 0),
//           0
//         ),
//       0
//     );

//   const canceledSales: any = (documentsDetails ?? [])
//     .flatMap((user: any) => user.consultations ?? [])
//     .flatMap((consultation: any) => consultation.documents ?? [])
//     .filter((doc: any) => doc.status === "canceled" && doc.type === "estimate")
//     .reduce(
//       (sum: any, doc: any) =>
//         sum +
//         (doc.items ?? []).reduce(
//           (subSum: any, item: any) => subSum + (item.amount ?? 0),
//           0
//         ),
//       0
//     );

//   const canceledPurchases: any = (documentsDetails ?? [])
//     .flatMap((user: any) => user.consultations ?? [])
//     .flatMap((consultation: any) => consultation.documents ?? [])
//     .filter((doc: any) => doc.status === "canceled" && doc.type === "order")
//     .reduce(
//       (sum: any, doc: any) =>
//         sum +
//         (doc.items ?? []).reduce(
//           (subSum: any, item: any) => subSum + (item.amount ?? 0),
//           0
//         ),
//       0
//     );

//   const getStatusText = (status: string) => {
//     switch (status) {
//       case "pending":
//         return "진행 중";
//       case "completed":
//         return "완료됨";
//       case "canceled":
//         return "취소됨";
//       default:
//         return "알 수 없음";
//     }
//   };

//   return (
//     <div className="text-sm text-[#333]">
//       <div className="mb-4">
//         {/* <Link
//           href="/reports/users"
//           className="text-blue-500 hover:font-semibold"
//         >
//           영업 직원 목록{" "}
//         </Link> */}
//         <span className="text-[#333] font-semibold">영업 기록</span>
//       </div>

//       {/* 🔹 유저 정보 섹션 */}
//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <div className="bg-[#FBFBFB] rounded-md border px-6 py-6 shadow-sm">
//           {/* 🔹 유저 정보 섹션 */}
//           <div className="flex justify-between items-center border-b pb-4 mb-4">
//             <div>
//               <p className="text-xl font-bold text-gray-800">
//                 {user?.name} {user?.level}{" "}
//                 <span className="text-gray-600">({user?.position})</span>
//               </p>
//               <p className="text-gray-600 text-sm mt-1">
//                 🎯 목표 금액:{" "}
//                 <span className="font-semibold text-blue-600">
//                   {user?.target?.toLocaleString() || "-"} 원
//                 </span>
//               </p>
//             </div>
//           </div>
//           <div className="text-sm text-gray-600 mt-2 grid grid-cols-3">
//             <p>
//               🟢 확정된 매출 -{" "}
//               <span className="font-semibold text-gray-800">
//                 {completedSales.toLocaleString()} 원
//               </span>
//             </p>
//             <p>
//               🟢 확정된 매입 -{" "}
//               <span className="font-semibold text-gray-800">
//                 {completedPurchases.toLocaleString()} 원
//               </span>
//             </p>
//             <p>
//               🟡 진행 중 매출 -{" "}
//               <span className="font-semibold text-gray-800">
//                 {pendingSales.toLocaleString()} 원
//               </span>
//             </p>
//             <p>
//               🟡 진행 중 매입 -{" "}
//               <span className="font-semibold text-gray-800">
//                 {pendingPurchases.toLocaleString()} 원
//               </span>
//             </p>
//             <p>
//               🔴 취소된 매출 -{" "}
//               <span className="font-semibold text-gray-800">
//                 {canceledSales.toLocaleString()} 원
//               </span>
//             </p>
//             <p>
//               🔴 취소된 매입 -{" "}
//               <span className="font-semibold text-gray-800">
//                 {canceledPurchases.toLocaleString()} 원
//               </span>
//             </p>
//           </div>
//         </div>

//         <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
//           <p className="text-lg font-semibold text-gray-700 ">
//             📅 데이터 기간 선택
//           </p>
//           <div className="grid grid-cols-3 gap-4 mt-2">
//             {/* 🔹 연도 선택 */}
//             <select
//               className="border-2 border-blue-400 p-2 rounded-md text-gray-700 w-full"
//               value={selectedYear}
//               onChange={(e) => setSelectedYear(Number(e.target.value))}
//             >
//               {Array.from(
//                 { length: new Date().getFullYear() - 2010 + 1 },
//                 (_, i) => {
//                   const year = new Date().getFullYear() - i;
//                   return (
//                     <option key={year} value={year}>
//                       {year}
//                     </option>
//                   );
//                 }
//               )}
//             </select>

//             {/* 🔹 필터 선택 */}
//             <select
//               className="border p-2 rounded-md w-full"
//               value={dateFilter}
//               onChange={(e) =>
//                 setDateFilter(e.target.value as "year" | "quarter" | "month")
//               }
//             >
//               <option value="year">연도별</option>
//               <option value="quarter">분기별</option>
//               <option value="month">월별</option>
//             </select>

//             {/* 🔹 분기 선택 */}
//             {dateFilter === "quarter" && (
//               <select
//                 className="border p-2 rounded-md w-full"
//                 value={selectedQuarter}
//                 onChange={(e) => setSelectedQuarter(Number(e.target.value))}
//               >
//                 <option value="1">1분기 (1~3월)</option>
//                 <option value="2">2분기 (4~6월)</option>
//                 <option value="3">3분기 (7~9월)</option>
//                 <option value="4">4분기 (10~12월)</option>
//               </select>
//             )}

//             {/* 🔹 월 선택 */}
//             {dateFilter === "month" && (
//               <select
//                 className="border p-2 rounded-md w-full"
//                 value={selectedMonth}
//                 onChange={(e) => setSelectedMonth(Number(e.target.value))}
//               >
//                 {Array.from({ length: 12 }, (_, i) => (
//                   <option key={i + 1} value={i + 1}>
//                     {i + 1}월
//                   </option>
//                 ))}
//               </select>
//             )}
//           </div>
//           <div>
//             <div className="grid grid-cols-2 gap-4 mt-4">
//               {/* ✅ 견적서 */}
//               <div className="bg-white p-4 rounded-lg shadow">
//                 <p className="text-md font-semibold">📄 견적서</p>
//                 <ul className="mt-2 space-y-2">
//                   <li className="flex justify-between text-sm text-yellow-700 font-medium">
//                     진행 중{" "}
//                     <span className="font-bold text-yellow-600">
//                       {estimates.pending}건
//                     </span>
//                   </li>
//                   <li className="flex justify-between text-sm text-green-700 font-medium">
//                     완료됨{" "}
//                     <span className="font-bold text-green-600">
//                       {estimates.completed}건
//                     </span>
//                   </li>
//                   <li className="flex justify-between text-sm text-red-700 font-medium">
//                     취소됨{" "}
//                     <span className="font-bold text-red-600">
//                       {estimates.canceled}건
//                     </span>
//                   </li>
//                 </ul>
//               </div>

//               {/* ✅ 발주서 */}
//               <div className="bg-white p-4 rounded-lg shadow">
//                 <p className="text-md font-semibold ">📑 발주서</p>
//                 <ul className="mt-2 space-y-2">
//                   <li className="flex justify-between text-sm text-yellow-700 font-medium">
//                     진행 중{" "}
//                     <span className="font-bold text-yellow-600">
//                       {orders.pending}건
//                     </span>
//                   </li>
//                   <li className="flex justify-between text-sm text-green-700 font-medium">
//                     완료됨{" "}
//                     <span className="font-bold text-green-600">
//                       {orders.completed}건
//                     </span>
//                   </li>
//                   <li className="flex justify-between text-sm text-red-700 font-medium">
//                     취소됨{" "}
//                     <span className="font-bold text-red-600">
//                       {orders.canceled}건
//                     </span>
//                   </li>
//                 </ul>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/*  */}
//       <div className="bg-[#FBFBFB] rounded-md border px-6 py-4 mb-4">
//         <h2 className="text-lg font-bold mb-4">상담 내역 & 문서 & 품목</h2>

//         {/* 🔹 스크롤 가능 영역 */}
//         <div className="overflow-x-auto">
//           <div className="grid grid-cols-[2fr_1fr_2fr] gap-6 min-w-[900px] font-semibold text-gray-700">
//             <div>상담 기록</div>
//             <div>관련 문서</div>
//             <div>품목 리스트</div>
//           </div>

//           {/* 🔹 상담 기록 + 문서 + 품목 */}
//           <div className="space-y-4 mt-2 overflow-y-auto max-h-[700px]">
//             {documentsDetails?.map((user: any) =>
//               user.consultations.map((consultation: any) => (
//                 <div
//                   key={consultation.consultation_id}
//                   className="grid grid-cols-[2fr_1fr_2fr] gap-6 items-center border-b pb-4"
//                 >
//                   {/* 🔹 상담 기록 */}
//                   <div className="p-3 border rounded-md bg-white">
//                     <div className="text-sm text-gray-600">
//                       {consultation.date}
//                       <span
//                         className="font-bold ml-2 text-blue-500 cursor-pointer "
//                         onClick={() =>
//                           router.push(
//                             `/consultations/${consultation.company_id}`
//                           )
//                         }
//                       >
//                         {consultation.company_name}
//                       </span>
//                     </div>
//                     <p className="text-gray-800 whitespace-pre-line">
//                       {consultation.content}
//                     </p>
//                   </div>

//                   {/* 🔹 관련 문서 */}
//                   <div className="p-3 border rounded-md bg-white">
//                     {consultation.documents.length > 0 ? (
//                       consultation.documents.map((doc: any) => (
//                         <div
//                           key={doc.document_id}
//                           className="p-2 border rounded-md bg-gray-50 shadow-sm"
//                         >
//                           <p className="text-sm font-semibold text-blue-600">
//                             {doc.type === "estimate"
//                               ? "📄 견적서"
//                               : "📑 발주서"}
//                             <span className="pl-2">
//                               ({getStatusText(doc.status)})
//                             </span>
//                           </p>
//                           <p className="text-xs text-gray-700">
//                             문서번호:{" "}
//                             <span className="font-semibold">
//                               {doc.document_number}
//                             </span>
//                           </p>
//                           <p className="text-xs text-gray-500">
//                             생성일: {doc.created_at.split("T")[0]}
//                           </p>
//                           <p className="text-xs">
//                             담당자:{" "}
//                             <span className="font-semibold">
//                               {doc.user.name}
//                             </span>{" "}
//                             ({doc.user.level})
//                           </p>
//                         </div>
//                       ))
//                     ) : (
//                       <p className="text-gray-400 text-sm">📂 관련 문서 없음</p>
//                     )}
//                   </div>

//                   {/* 🔹 품목 리스트 */}
//                   <div className="p-3 border rounded-md bg-white">
//                     {consultation.documents.length > 0 ? (
//                       consultation.documents.map((doc: any) =>
//                         doc.items.map((item: any, itemIndex: any) => (
//                           <div
//                             key={itemIndex}
//                             className="grid grid-cols-4 gap-4 p-2 border rounded-md bg-gray-50 text-sm"
//                           >
//                             <span className="text-gray-700">{item.name}</span>
//                             <span className="text-gray-500">{item.spec}</span>
//                             <span className="text-gray-500">
//                               {item.quantity}
//                             </span>
//                             <span className="text-blue-600 font-semibold">
//                               {Number(item.amount).toLocaleString()} 원
//                             </span>
//                           </div>
//                         ))
//                       )
//                     ) : (
//                       <p className="text-gray-400 text-sm">📦 품목 없음</p>
//                     )}
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>
//       {/*  */}
//       {/* 🔹 차트 (견적 & 발주 실적) */}
//       <div className="grid grid-cols-2 gap-4">
//         <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
//           <p className="text-lg font-semibold mb-4">🏢 거래처별 매출 비중</p>
//           {/* 🔹 매출 차트 */}
//           <ReactApexChart
//             options={{
//               labels: salesChart.labels,
//               legend: { position: "bottom" },
//               yaxis: {
//                 labels: {
//                   formatter: (value: number) => value.toLocaleString(), // ✅ 콤마 추가
//                 },
//               },
//             }}
//             series={salesChart.data}
//             type="pie"
//             height={300}
//           />
//         </div>
//         <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
//           {" "}
//           <p className="text-lg font-semibold mb-4">🏢 거래처별 매입 비중</p>
//           <ReactApexChart
//             options={{
//               labels: purchaseChart.labels,
//               legend: { position: "bottom" },
//               yaxis: {
//                 labels: {
//                   formatter: (value: number) => value.toLocaleString(), // ✅ 콤마 추가
//                 },
//               },
//             }}
//             series={purchaseChart.data}
//             type="pie"
//             height={300}
//           />
//         </div>

//         {/* 🟦 견적 실적 (Area Chart) */}
//         <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
//           <p className="text-lg font-semibold mb-4">📈 견적 금액</p>
//           <ReactApexChart
//             options={{
//               chart: { type: "area" },
//               xaxis: {
//                 categories: ["진행 중", "완료", "취소"], // X축: 진행 중, 완료, 취소
//               },
//               yaxis: {
//                 labels: {
//                   formatter: (value) => value.toLocaleString(), // 숫자 천 단위 콤마 적용
//                 },
//               },
//               stroke: {
//                 curve: "smooth", // 부드러운 곡선
//               },
//               dataLabels: {
//                 enabled: true,
//                 formatter: (value) => value.toLocaleString(),
//               },
//               colors: ["#3498db", "#2ecc71", "#e74c3c"], // 진행 중(파랑), 완료(초록), 취소(빨강)
//             }}
//             series={[
//               {
//                 name: "견적 실적",
//                 data: [
//                   salesSummary?.[userId]?.estimates?.pending || 0, // 진행 중
//                   salesSummary?.[userId]?.estimates?.completed || 0, // 완료
//                   salesSummary?.[userId]?.estimates?.canceled || 0, // 취소
//                 ],
//               },
//             ]}
//             type="area"
//             height={300}
//           />
//         </div>

//         {/* 🟩 발주 실적 (Area Chart) */}
//         <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
//           <p className="text-lg font-semibold mb-4">📈 발주 금액</p>
//           <ReactApexChart
//             options={{
//               chart: { type: "area" },
//               xaxis: {
//                 categories: ["진행 중", "완료", "취소"], // X축: 진행 중, 완료, 취소
//               },
//               yaxis: {
//                 labels: {
//                   formatter: (value) => value.toLocaleString(), // 숫자 천 단위 콤마 적용
//                 },
//               },
//               stroke: {
//                 curve: "smooth", // 부드러운 곡선
//               },
//               dataLabels: {
//                 enabled: true,
//                 formatter: (value) => value.toLocaleString(),
//               },
//               colors: ["#1abc9c", "#f39c12", "#e74c3c"], // 진행 중(초록), 완료(노랑), 취소(빨강)
//             }}
//             series={[
//               {
//                 name: "발주 실적",
//                 data: [
//                   salesSummary?.[userId]?.orders?.pending || 0, // 진행 중
//                   salesSummary?.[userId]?.orders?.completed || 0, // 완료
//                   salesSummary?.[userId]?.orders?.canceled || 0, // 취소
//                 ],
//               },
//             ]}
//             type="area"
//             height={300}
//           />
//         </div>
//       </div>

//       {/* 🔹 거래처 & 품목 테이블 */}
//       <div className="grid grid-cols-2 gap-4 my-4">
//         {/* 🔹 매출 거래처 목록 */}
//         <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
//           <p className="text-lg font-semibold mb-2">🏢 매출 거래처</p>
//           {aggregatedSalesCompanies.length > 0 ? (
//             aggregatedSalesCompanies.map((c: any) => (
//               <p key={c.name} className="border-b py-2">
//                 {c.name} - {c.total.toLocaleString()} 원
//               </p>
//             ))
//           ) : (
//             <p className="text-gray-500">매출 거래처 없음</p>
//           )}
//         </div>

//         {/* 🔹 매입 거래처 목록 */}
//         <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
//           <p className="text-lg font-semibold mb-2">🏢 매입 거래처</p>
//           {aggregatedPurchaseCompanies.length > 0 ? (
//             aggregatedPurchaseCompanies.map((c: any) => (
//               <p key={c.name} className="border-b py-2">
//                 {c.name} - {c.total.toLocaleString()} 원
//               </p>
//             ))
//           ) : (
//             <p className="text-gray-500">매입 거래처 없음</p>
//           )}
//         </div>
//         <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
//           <p className="text-lg font-semibold mb-2">📦 매출 품목</p>
//           {aggregatedSalesProducts.length > 0 ? (
//             aggregatedSalesProducts.map((p: any) => (
//               <p key={`${p.name}-${p.spec}`} className="border-b py-2">
//                 {p.name} ({p.spec}) {p.quantity}- {p.total.toLocaleString()} 원
//               </p>
//             ))
//           ) : (
//             <p className="text-gray-500">매출 품목 없음</p>
//           )}
//         </div>

//         {/* 🔹 매입 품목 목록 */}
//         <div className="bg-[#FBFBFB] rounded-md border px-6 py-4">
//           <p className="text-lg font-semibold mb-2">📦 매입 품목</p>
//           {aggregatedPurchaseProducts.length > 0 ? (
//             aggregatedPurchaseProducts.map((p: any) => (
//               <p key={`${p.name}-${p.spec}`} className="border-b py-2">
//                 {p.name} ({p.spec}) {p.quantity}- {p.total.toLocaleString()} 원
//               </p>
//             ))
//           ) : (
//             <p className="text-gray-500">매입 품목 없음</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
