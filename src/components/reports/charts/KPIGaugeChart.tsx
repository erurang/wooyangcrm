"use client";

import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

interface KPIGaugeChartProps {
  value: number;
  target: number;
  label: string;
  unit?: string;
  color?: string;
  height?: number;
}

/**
 * KPI 게이지 차트
 * - 목표 대비 달성률 시각화
 * - 반원형 게이지 형태
 *
 * @example
 * <KPIGaugeChart
 *   value={75000000}
 *   target={100000000}
 *   label="월간 매출 달성률"
 *   unit="원"
 * />
 */
export default function KPIGaugeChart({
  value,
  target,
  label,
  unit = "",
  color = "#4f46e5",
  height = 200,
}: KPIGaugeChartProps) {
  // 달성률 계산 (0 ~ 100)
  const percentage = target > 0 ? Math.min(Math.round((value / target) * 100), 100) : 0;

  // 색상 결정 (달성률에 따라)
  const getColor = () => {
    if (percentage >= 100) return "#22c55e"; // green
    if (percentage >= 80) return "#3b82f6"; // blue
    if (percentage >= 50) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  const chartOptions: ApexOptions = {
    chart: {
      type: "radialBar",
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          size: "60%",
        },
        track: {
          background: "#e5e7eb",
          strokeWidth: "100%",
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: "12px",
            fontWeight: 500,
            color: "#6b7280",
            offsetY: -10,
          },
          value: {
            show: true,
            fontSize: "24px",
            fontWeight: 700,
            color: getColor(),
            offsetY: 5,
            formatter: function () {
              return `${percentage}%`;
            },
          },
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: [getColor()],
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: "round",
    },
    labels: [label],
    colors: [getColor()],
  };

  const formatValue = (num: number) => {
    if (num >= 100000000) {
      return `${(num / 100000000).toFixed(1)}억${unit}`;
    }
    if (num >= 10000) {
      return `${(num / 10000).toFixed(0)}만${unit}`;
    }
    return `${num.toLocaleString()}${unit}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <ReactApexChart
        type="radialBar"
        series={[percentage]}
        options={chartOptions}
        height={height}
      />
      <div className="text-center mt-2">
        <p className="text-sm text-slate-500">
          {formatValue(value)} / {formatValue(target)}
        </p>
      </div>
    </div>
  );
}
