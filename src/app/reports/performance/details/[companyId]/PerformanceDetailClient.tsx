"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useLoginUser } from "@/context/login";

import {
  PerformanceHeader,
  YearSelector,
  EmptyDataView,
  MonthlySalesChart,
  ProductRatioChart,
  TransactionFrequencyChart,
  TransactionSalesChart,
  YearlyGrowthChart,
  PotentialCustomerChart,
} from "@/components/reports/performance/detail";

interface AnalysisData {
  companyName: string;
  availableYears: number[];
  yearlyData: Record<number, Record<string, number>>;
  productData: Record<number, Record<string, number>>;
  transactionData: Record<number, Record<string, number>>;
  transactionSummary: any;
}

export default function PerformanceDetailClient() {
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
      const yearQuery = years.map((y) => `year=${y}`).join("&");
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

  const toggleYearSelection = (year: number) => {
    setSelectedYears((prev) => {
      if (year === currentYear) return prev;
      const updatedYears = prev.includes(year)
        ? prev.filter((y) => y !== year)
        : [...prev, year];
      fetchData(updatedYears);
      return updatedYears;
    });
  };

  const isEmptyData =
    !data ||
    !data.yearlyData ||
    Object.keys(data.yearlyData).length === 0 ||
    data.availableYears.length === 0;

  if (isEmptyData) return <EmptyDataView />;

  // 연도 정렬 (CurrentYear을 마지막으로)
  const sortedYears = [...selectedYears].sort((a, b) => {
    if (a === currentYear) return 1;
    if (b === currentYear) return -1;
    return a - b;
  });

  // 연도별 성장률 계산
  const minYear = Math.min(...data.availableYears, currentYear);
  const maxYear = Math.max(...data.availableYears, currentYear);
  const allYears = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i
  );

  const yearlySales: number[] = allYears.map((year) =>
    Object.values(data.yearlyData[year] || {}).reduce(
      (sum, value) => sum + value,
      0
    )
  );

  let lastValidSales: number | null = null;
  const yearlyGrowthRates: { year: number; growth: number }[] = [];
  allYears.forEach((year, index) => {
    const sales = yearlySales[index];

    if (sales === 0) {
      yearlyGrowthRates.push({ year, growth: 0 });
      return;
    }

    if (lastValidSales !== null) {
      const growth = ((sales - lastValidSales) / lastValidSales) * 100;
      yearlyGrowthRates.push({ year, growth: Math.round(growth * 100) / 100 });
    } else {
      yearlyGrowthRates.push({ year, growth: 0 });
    }

    lastValidSales = sales;
  });

  return (
    <div className="text-sm text-[#37352F]">
      <PerformanceHeader type={type} companyName={data.companyName} />

      <YearSelector
        availableYears={data.availableYears}
        selectedYears={selectedYears}
        currentYear={currentYear}
        onToggleYear={toggleYearSelection}
      />

      <div className="grid grid-cols-3 gap-4">
        <MonthlySalesChart
          type={type}
          selectedYears={selectedYears}
          currentYear={currentYear}
          yearlyData={data.yearlyData}
        />

        <ProductRatioChart
          type={type}
          sortedYears={sortedYears}
          productData={data.productData}
          selectedYears={selectedYears}
        />

        <TransactionFrequencyChart
          sortedYears={sortedYears}
          yearlyData={data.yearlyData}
        />

        <TransactionSalesChart
          type={type}
          sortedYears={sortedYears}
          yearlyData={data.yearlyData}
        />

        <YearlyGrowthChart type={type} yearlyGrowthRates={yearlyGrowthRates} />

        {type === "estimate" && (
          <PotentialCustomerChart
            sortedYears={sortedYears}
            transactionSummary={data.transactionSummary}
          />
        )}
      </div>
    </div>
  );
}
