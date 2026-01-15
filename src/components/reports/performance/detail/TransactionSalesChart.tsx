"use client";

import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface TransactionSalesChartProps {
  type: string | null;
  sortedYears: number[];
  yearlyData: Record<number, Record<string, number>>;
}

export default function TransactionSalesChart({
  type,
  sortedYears,
  yearlyData,
}: TransactionSalesChartProps) {
  const transactionCountSeries = sortedYears.map((year) => {
    const transactionCounts = Object.values(yearlyData?.[year] || {}).filter(
      (count) => count > 0
    )?.length;
    return transactionCounts;
  });

  const totalSalesSeries = sortedYears.map(
    (year) =>
      Object.values(yearlyData[year] || {}).reduce((acc, cur) => acc + cur, 0) ||
      0
  );

  return (
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
            data: totalSalesSeries,
          },
          {
            name: "거래 횟수 (건)",
            type: "column",
            data: transactionCountSeries,
          },
        ]}
        options={{
          chart: { stacked: false },
          stroke: { width: [3, 0] },
          xaxis: { categories: sortedYears.map((year) => `${year}년`) },
          yaxis: [
            { labels: { formatter: (val) => `${val.toLocaleString()}₩` } },
            { opposite: true },
          ],
          tooltip: {
            shared: true,
            y: { formatter: (val) => `${val.toLocaleString()}₩` },
          },
          dataLabels: {
            enabled: true,
            formatter: (val) =>
              typeof val === "number" ? val.toLocaleString() : "0",
          },
        }}
        height={350}
      />
    </div>
  );
}
