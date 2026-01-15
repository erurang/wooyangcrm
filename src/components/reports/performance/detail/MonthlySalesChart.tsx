"use client";

import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface MonthlySalesChartProps {
  type: string | null;
  selectedYears: number[];
  currentYear: number;
  yearlyData: Record<number, Record<string, number>>;
}

export default function MonthlySalesChart({
  type,
  selectedYears,
  currentYear,
  yearlyData,
}: MonthlySalesChartProps) {
  const series = selectedYears.map((year) => ({
    name: `${year}년`,
    data: Object.entries(yearlyData[year] || {})
      .sort(
        ([a], [b]) => parseInt(a.split("-")[1]) - parseInt(b.split("-")[1])
      )
      .map(([, amount]) => amount),
  }));

  const categories = Object.keys(yearlyData[currentYear] || {})
    .map((val) => val.split("-")[1].replace(/^0/, ""))
    .sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="mt-6 bg-[#FBFBFB] p-4 shadow rounded-lg">
      <h2 className="text-lg font-semibold">
        월별 {type === "estimate" ? "매출" : "매입"}추이
      </h2>
      <ReactApexChart
        type="area"
        series={series}
        options={{
          xaxis: {
            categories,
            labels: { formatter: (val) => `${val}` },
          },
          yaxis: {
            labels: {
              formatter: (val) =>
                typeof val === "number" ? val.toLocaleString() : "0",
            },
          },
          dataLabels: {
            enabled: true,
            formatter: (val) =>
              typeof val === "number" ? val.toLocaleString() : "0",
          },
          legend: { position: "top" },
        }}
        height={300}
      />
    </div>
  );
}
