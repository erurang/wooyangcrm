"use client";

import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface TransactionFrequencyChartProps {
  sortedYears: number[];
  yearlyData: Record<number, Record<string, number>>;
}

export default function TransactionFrequencyChart({
  sortedYears,
  yearlyData,
}: TransactionFrequencyChartProps) {
  const transactionFrequencySeries = sortedYears.map((year) => ({
    name: `${year}년`,
    data: Array.from({ length: 12 }, (_, i) => {
      const month = `${year}-${String(i + 1).padStart(2, "0")}`;
      return yearlyData?.[year]?.[month] > 0 ? 1 : 0;
    }),
  }));

  return (
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
            min: 0,
            forceNiceScale: true,
            labels: { formatter: (val) => Math.round(val).toString() },
          },
        }}
        height={300}
      />
    </div>
  );
}
