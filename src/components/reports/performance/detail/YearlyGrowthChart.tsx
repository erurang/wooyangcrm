"use client";

import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface YearlyGrowthChartProps {
  type: string | null;
  yearlyGrowthRates: { year: number; growth: number }[];
}

export default function YearlyGrowthChart({
  type,
  yearlyGrowthRates,
}: YearlyGrowthChartProps) {
  return (
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
  );
}
