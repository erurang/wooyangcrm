"use client";

import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ProductRatioChartProps {
  type: string | null;
  sortedYears: number[];
  productData: Record<number, Record<string, number>>;
  selectedYears: number[];
}

export default function ProductRatioChart({
  type,
  sortedYears,
  productData,
  selectedYears,
}: ProductRatioChartProps) {
  const productNames = Array.from(
    new Set(
      selectedYears.flatMap((year) => Object.keys(productData[year] || {}))
    )
  );

  const stackedProductSeries = productNames.map((product) => ({
    name: product,
    data: sortedYears.map((year) => {
      const totalSales = Object.values(productData[year] || {}).reduce(
        (acc, cur) => acc + cur,
        0
      );
      return totalSales > 0
        ? Math.round(((productData[year]?.[product] || 0) / totalSales) * 100)
        : 0;
    }),
  }));

  return (
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
  );
}
