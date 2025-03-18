"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import dynamic from "next/dynamic";
import { useProductDetail } from "@/hooks/products/useProductDetail";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type DateFilter = "year" | "quarter" | "month";

export default function ProductDetailChartPage() {
  const searchParams = useSearchParams();
  const docType =
    (searchParams.get("type") as "estimate" | "order") || "estimate";
  const itemName = searchParams.get("name") || "";

  // 날짜 필터 상태
  const [dateFilter, setDateFilter] = useState<DateFilter>("year");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );

  // 탭 상태: 회사와 상태 (status)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // 날짜 계산
  let startDate: string, endDate: string;
  if (dateFilter === "year") {
    startDate = `${selectedYear}-01-01`;
    endDate = `${selectedYear}-12-31`;
  } else if (dateFilter === "quarter") {
    startDate = `${selectedYear}-${(selectedQuarter - 1) * 3 + 1}-01`;
    endDate = dayjs(startDate)
      .add(3, "month")
      .endOf("month")
      .format("YYYY-MM-DD");
  } else {
    const dateObj = dayjs(`${selectedYear}-${selectedMonth}-01`);
    startDate = dateObj.startOf("month").format("YYYY-MM-DD");
    endDate = dateObj.endOf("month").format("YYYY-MM-DD");
  }

  // 데이터 로딩 (예: useProductDetail 훅)
  const { data, isLoading } = useProductDetail({
    docType,
    itemName,
    startDate,
    endDate,
  });

  // 고정된 12개월 배열 ("01" ~ "12")
  const fixedMonths = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );

  /*  
    회사별, 상태(status)별, 규격(spec)별 월별 unit_price 데이터를 계산  
    구조:
      result[company].seriesByStatus[status][spec][month] = { sumPrice, count, totalQty }
    최종적으로 각 회사별로
      finalResult[company].seriesByStatus[status] = { series: [ { name: spec, data: [...] } ] }
  */
  const companySpecMonthlyData = useMemo(() => {
    if (!data) return {};

    const result: Record<
      string,
      {
        seriesByStatus: Record<
          string,
          Record<
            string,
            Record<
              string,
              { sumPrice: number; count: number; totalQty: number }
            >
          >
        >;
      }
    > = {};

    data.forEach((row: any) => {
      const company = row.company_name || "???";
      const status = row.status || "unknown"; // status 값 (pending, completed, canceled)
      const spec = row.spec || "미지정";
      const month = dayjs(row.doc_date).format("MM");

      if (!result[company]) {
        result[company] = { seriesByStatus: {} };
      }
      if (!result[company].seriesByStatus[status]) {
        result[company].seriesByStatus[status] = {};
      }
      if (!result[company].seriesByStatus[status][spec]) {
        result[company].seriesByStatus[status][spec] = {};
      }
      if (!result[company].seriesByStatus[status][spec][month]) {
        result[company].seriesByStatus[status][spec][month] = {
          sumPrice: 0,
          count: 0,
          totalQty: 0,
        };
      }
      result[company].seriesByStatus[status][spec][month].sumPrice +=
        Number(row.unit_price) || 0;
      result[company].seriesByStatus[status][spec][month].count += 1;
      if (row.quantity) {
        const qtyNumber = parseFloat(row.quantity.replace(/[^0-9.]/g, ""));
        result[company].seriesByStatus[status][spec][month].totalQty +=
          qtyNumber || 0;
      }
    });

    // 최종 데이터 구조 생성
    const finalResult: Record<
      string,
      {
        seriesByStatus: Record<
          string,
          { series: { name: string; data: any[] }[] }
        >;
      }
    > = {};
    Object.keys(result).forEach((company) => {
      finalResult[company] = { seriesByStatus: {} };
      const statuses = result[company].seriesByStatus;
      Object.keys(statuses).forEach((status) => {
        const specMap = statuses[status];
        const seriesArr = Object.keys(specMap).map((spec) => {
          const monthData = specMap[spec];
          const dataPoints = fixedMonths.map((month) => {
            const monthObj = monthData[month];
            let avgPrice = 0;
            let totalQty = 0;
            if (monthObj) {
              avgPrice =
                monthObj.count > 0 ? monthObj.sumPrice / monthObj.count : 0;
              totalQty = monthObj.totalQty;
            }
            return {
              x: `${parseInt(month, 10)}월`,
              y: Math.round(avgPrice),
              custom: { totalQty },
            };
          });
          return { name: spec, data: dataPoints };
        });
        finalResult[company].seriesByStatus[status] = { series: seriesArr };
      });
    });

    return finalResult;
  }, [data, fixedMonths]);

  // 선택할 회사가 없으면 기본값을 설정 (데이터 로드 후)
  useEffect(() => {
    const companies = Object.keys(companySpecMonthlyData);
    if (companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0]);
    }
  }, [companySpecMonthlyData, selectedCompany]);

  // selectedCompany가 변경될 때만 기본 상태를 설정
  useEffect(() => {
    if (selectedCompany) {
      const availableStatuses = Object.keys(
        companySpecMonthlyData[selectedCompany]?.seriesByStatus || {}
      );
      if (availableStatuses.length > 0) {
        const preferredOrder = ["completed", "pending", "canceled"];
        const defaultStatus =
          preferredOrder.find((s) => availableStatuses.includes(s)) ||
          availableStatuses[0];
        setSelectedStatus(defaultStatus);
      }
    }
  }, [selectedCompany]);

  // 상태 표시용 레이블 (예: completed → 완료, pending → 진행중, canceled → 취소)
  const statusLabels: Record<string, string> = {
    completed: "완료",
    pending: "진행중",
    canceled: "취소",
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">
        {docType === "estimate" ? "견적" : "발주"} 품목 차트: {itemName}
      </h1>

      {/* 날짜 필터 UI */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as DateFilter)}
        >
          <option value="year">연도별</option>
          <option value="quarter">분기별</option>
          <option value="month">월별</option>
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(+e.target.value)}
        >
          {Array.from({ length: 10 }, (_, i) => {
            const year = new Date().getFullYear() - i;
            return (
              <option key={year} value={year}>
                {year}
              </option>
            );
          })}
        </select>
        {dateFilter === "quarter" && (
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(+e.target.value)}
          >
            <option value={1}>1분기</option>
            <option value={2}>2분기</option>
            <option value={3}>3분기</option>
            <option value={4}>4분기</option>
          </select>
        )}
        {dateFilter === "month" && (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(+e.target.value)}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}월
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <p>로딩중...</p>
      ) : !data ? (
        <p>데이터 없음</p>
      ) : (
        <div>
          {/* 회사 탭 */}
          <div className="mb-4">
            <div className="flex space-x-2 border-b">
              {Object.keys(companySpecMonthlyData).map((company) => (
                <button
                  key={company}
                  className={`px-4 py-2 focus:outline-none ${
                    selectedCompany === company
                      ? "border-b-2 border-blue-500 font-bold"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedCompany(company);
                    setSelectedStatus(null); // 회사 변경 시 상태 초기화
                  }}
                >
                  {company}
                </button>
              ))}
            </div>
          </div>

          {/* 상태 탭 (선택된 회사 내) */}
          {selectedCompany && companySpecMonthlyData[selectedCompany] && (
            <div className="mb-4">
              <div className="flex space-x-2 border-b">
                {Object.keys(
                  companySpecMonthlyData[selectedCompany]?.seriesByStatus
                )
                  .sort((a, b) => {
                    const order = ["completed", "pending", "canceled"];
                    return order.indexOf(a) - order.indexOf(b);
                  })
                  .map((status) => (
                    <button
                      key={status}
                      className={`px-4 py-2 focus:outline-none ${
                        selectedStatus === status
                          ? "border-b-2 border-blue-500 font-bold"
                          : ""
                      }`}
                      onClick={() => setSelectedStatus(status)}
                    >
                      {statusLabels[status] || status}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* 차트 영역 */}
          {selectedCompany && selectedStatus && (
            <div>
              <h2 className="text-lg font-semibold mb-2">
                {selectedCompany} -{" "}
                {statusLabels[selectedStatus] || selectedStatus} 차트
              </h2>
              <ReactApexChart
                options={{
                  chart: { type: "line", toolbar: { show: false } },
                  legend: { show: true },
                  xaxis: {
                    categories: fixedMonths.map((m) => `${parseInt(m, 10)}월`),
                    labels: { rotate: -45 },
                  },
                  tooltip: {
                    custom: function ({
                      series,
                      seriesIndex,
                      dataPointIndex,
                      w,
                    }) {
                      const dataPoint =
                        w.config.series[seriesIndex].data[dataPointIndex];
                      const specName = w.config.series[seriesIndex].name;
                      return `<div style="padding: 8px;">
                                <div>스펙: ${specName}</div>
                                <div>평균 단가: ${dataPoint.y.toLocaleString()}</div>
                                <div>수량: ${dataPoint.custom.totalQty}</div>
                              </div>`;
                    },
                  },
                }}
                series={companySpecMonthlyData[selectedCompany]?.seriesByStatus[
                  selectedStatus
                ].series.map((s) => ({
                  name: s.name,
                  data: s.data,
                }))}
                type="area"
                height={300}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
