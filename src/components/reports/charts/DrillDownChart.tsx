"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { ApexOptions } from "apexcharts";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

interface DrillDownLevel {
  title: string;
  data: {
    name: string;
    value: number;
    details?: DrillDownLevel;
    onClick?: () => void;
  }[];
}

interface DrillDownChartProps {
  initialData: DrillDownLevel;
  type?: "bar" | "pie" | "donut";
  height?: number;
  colorPalette?: string[];
  valueFormatter?: (value: number) => string;
  onDrillDown?: (level: number, item: string) => void;
}

/**
 * 드릴다운 차트 컴포넌트
 * - 차트 요소 클릭으로 세부 데이터 탐색
 * - 뒤로가기 지원
 *
 * @example
 * <DrillDownChart
 *   initialData={{
 *     title: "카테고리별 매출",
 *     data: [
 *       { name: "소재", value: 100, details: { title: "소재 상세", data: [...] } },
 *       { name: "화학", value: 80, details: { title: "화학 상세", data: [...] } },
 *     ]
 *   }}
 *   onDrillDown={(level, item) => console.log(`Level ${level}: ${item}`)}
 * />
 */
export default function DrillDownChart({
  initialData,
  type = "bar",
  height = 350,
  colorPalette = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
  valueFormatter = (v) => v.toLocaleString(),
  onDrillDown,
}: DrillDownChartProps) {
  const [levelStack, setLevelStack] = useState<DrillDownLevel[]>([initialData]);
  const currentLevel = levelStack[levelStack.length - 1];

  // 드릴다운 - 하위 레벨로 이동
  const handleDrillDown = useCallback(
    (index: number) => {
      const item = currentLevel.data[index];

      // 커스텀 onClick이 있으면 실행
      if (item.onClick) {
        item.onClick();
        return;
      }

      // 하위 데이터가 있으면 드릴다운
      if (item.details) {
        setLevelStack((prev) => [...prev, item.details!]);
        onDrillDown?.(levelStack.length, item.name);
      }
    },
    [currentLevel.data, levelStack.length, onDrillDown]
  );

  // 뒤로가기 - 상위 레벨로 이동
  const handleGoBack = useCallback(() => {
    if (levelStack.length > 1) {
      setLevelStack((prev) => prev.slice(0, -1));
    }
  }, [levelStack.length]);

  // 최상위로 이동
  const handleGoToTop = useCallback(() => {
    setLevelStack([initialData]);
  }, [initialData]);

  // 차트 옵션 생성
  const chartOptions: ApexOptions = {
    chart: {
      type: type === "donut" ? "donut" : type,
      toolbar: {
        show: false,
      },
      events: {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const { dataPointIndex } = config;
          handleDrillDown(dataPointIndex);
        },
      },
    },
    plotOptions:
      type === "bar"
        ? {
            bar: {
              horizontal: false,
              borderRadius: 4,
              dataLabels: {
                position: "top",
              },
            },
          }
        : {},
    dataLabels: {
      enabled: type !== "bar",
      formatter: function (val: any, opts: any) {
        if (type === "pie" || type === "donut") {
          return `${opts.w.globals.labels[opts.seriesIndex]}: ${Number(val).toFixed(1)}%`;
        }
        return valueFormatter(val);
      },
    },
    xaxis:
      type === "bar"
        ? {
            categories: currentLevel.data.map((d) => d.name),
            labels: {
              style: {
                fontSize: "12px",
              },
            },
          }
        : {},
    yaxis:
      type === "bar"
        ? {
            labels: {
              formatter: valueFormatter,
            },
          }
        : {},
    tooltip: {
      y: {
        formatter: valueFormatter,
      },
    },
    labels: type !== "bar" ? currentLevel.data.map((d) => d.name) : [],
    colors: colorPalette,
    legend: {
      position: "bottom",
      fontSize: "12px",
    },
    stroke: {
      show: type !== "pie" && type !== "donut",
    },
    fill: {
      opacity: 1,
    },
  };

  // 시리즈 데이터
  const series =
    type === "bar"
      ? [
          {
            name: currentLevel.title,
            data: currentLevel.data.map((d) => d.value),
          },
        ]
      : currentLevel.data.map((d) => d.value);

  // 드릴다운 가능 여부 표시
  const hasDetails = currentLevel.data.some((d) => d.details || d.onClick);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {levelStack.length > 1 && (
            <button
              onClick={handleGoBack}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              title="뒤로가기"
            >
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
          )}
          <h3 className="text-sm font-semibold text-slate-800">
            {currentLevel.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {levelStack.length > 1 && (
            <button
              onClick={handleGoToTop}
              className="text-xs text-sky-600 hover:text-sky-800 transition-colors"
            >
              처음으로
            </button>
          )}
          {hasDetails && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              클릭하여 상세보기
              <ChevronRight className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* 브레드크럼 */}
      {levelStack.length > 1 && (
        <div className="flex items-center gap-1 mb-3 text-xs text-slate-500">
          {levelStack.map((level, idx) => (
            <span key={idx} className="flex items-center">
              {idx > 0 && <ChevronRight className="w-3 h-3 mx-1" />}
              <button
                onClick={() => setLevelStack((prev) => prev.slice(0, idx + 1))}
                className={`hover:text-sky-600 transition-colors ${
                  idx === levelStack.length - 1 ? "font-medium text-slate-700" : ""
                }`}
              >
                {level.title}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 차트 */}
      {currentLevel.data.length > 0 ? (
        <ReactApexChart
          type={type === "donut" ? "donut" : type}
          series={series}
          options={chartOptions}
          height={height}
        />
      ) : (
        <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
          표시할 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
