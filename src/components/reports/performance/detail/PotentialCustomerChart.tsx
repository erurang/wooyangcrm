"use client";

import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface TransactionSummary {
  completed: { count: number; totalSales: number };
  pending: { count: number; totalSales: number };
  canceled: { count: number; totalSales: number };
}

interface PotentialCustomerChartProps {
  sortedYears: number[];
  transactionSummary: Record<number, TransactionSummary>;
}

export default function PotentialCustomerChart({
  sortedYears,
  transactionSummary,
}: PotentialCustomerChartProps) {
  return (
    <div className="mt-6 bg-[#FBFBFB] p-4 shadow rounded-lg">
      <h2 className="text-lg font-semibold">잠재고객</h2>
      <ReactApexChart
        type="bar"
        series={[
          {
            name: "완료된 거래 (건)",
            type: "column",
            data: sortedYears.map(
              (year) => transactionSummary[year]?.completed.count || 0
            ),
          },
          {
            name: "진행 중 거래 (건)",
            type: "column",
            data: sortedYears.map(
              (year) => transactionSummary[year]?.pending.count || 0
            ),
          },
          {
            name: "취소된 거래 (건)",
            type: "column",
            data: sortedYears.map(
              (year) => transactionSummary[year]?.canceled.count || 0
            ),
          },
          {
            name: "완료된 거래 매출 (₩)",
            type: "line",
            data: sortedYears.map(
              (year) => transactionSummary[year]?.completed.totalSales || 0
            ),
          },
          {
            name: "진행 중 거래 매출 (₩)",
            type: "line",
            data: sortedYears.map(
              (year) => transactionSummary[year]?.pending.totalSales || 0
            ),
          },
          {
            name: "취소된 거래 매출 (₩)",
            type: "line",
            data: sortedYears.map(
              (year) => transactionSummary[year]?.canceled.totalSales || 0
            ),
          },
        ]}
        options={{
          chart: { stacked: false, toolbar: { show: false } },
          stroke: { width: [0, 0, 0, 3, 3, 3] },
          xaxis: { categories: sortedYears.map((year) => `${year}년`) },
          yaxis: [
            {
              title: { text: "거래 횟수 (건)" },
              labels: { formatter: (val) => `${val.toLocaleString()}건` },
            },
            {
              opposite: true,
              title: { text: "매출 (₩)" },
              labels: { formatter: (val) => `${val.toLocaleString()}₩` },
            },
          ],
          tooltip: {
            shared: true,
            intersect: false,
            y: { formatter: (val) => `${val.toLocaleString()}₩` },
          },
          colors: [
            "#008FFB",
            "#00E396",
            "#FF4560",
            "#FF9800",
            "#775DD0",
            "#546E7A",
          ],
        }}
        height={400}
      />
    </div>
  );
}
