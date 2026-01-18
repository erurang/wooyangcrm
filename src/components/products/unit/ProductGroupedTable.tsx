"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  X,
  BarChart3,
  Users,
  Maximize2,
  FileText,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface PriceHistory {
  price: number;
  quantity: string;
  unit: string;
  date: string;
  documentNumber: string;
  documentId: string;
}

interface CompanyPrice {
  companyName: string;
  companyId: string;
  latestPrice: number;
  latestDate: string;
  priceHistory: PriceHistory[];
}

interface GroupedProduct {
  groupKey: string;
  name: string;
  spec: string;
  recordCount: number;
  companyCount: number;
  latestPrice: number;
  latestDate: string;
  latestCompany: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  priceByCompany: CompanyPrice[];
}

interface ProductGroupedTableProps {
  products: GroupedProduct[];
  isLoading: boolean;
  type: "estimate" | "order";
  onDocumentClick?: (documentId: string) => void;
}

type ChartViewMode = "summary" | "byCompany";

export default function ProductGroupedTable({
  products,
  isLoading,
  onDocumentClick,
}: ProductGroupedTableProps) {
  const router = useRouter();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [chartGroup, setChartGroup] = useState<GroupedProduct | null>(null);
  const [chartViewMode, setChartViewMode] = useState<ChartViewMode>("summary");

  // ESC 키로 모달 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && chartGroup) {
        setChartGroup(null);
      }
    },
    [chartGroup]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString() + "원";
  };

  const getPriceDiffPercent = (latestPrice: number, avgPrice: number) => {
    if (avgPrice === 0) return 0;
    return Math.round(((latestPrice - avgPrice) / avgPrice) * 100);
  };

  // 인라인 차트용 데이터 (평균 단가 라인만)
  const getInlineChartData = (group: GroupedProduct) => {
    const dateMap = new Map<string, number[]>();

    group.priceByCompany.forEach((company) => {
      company.priceHistory.forEach((h) => {
        const dateKey = dayjs(h.date).format("YY.MM.DD");
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, []);
        }
        dateMap.get(dateKey)!.push(h.price);
      });
    });

    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
      const dateA = dayjs(a, "YY.MM.DD").valueOf();
      const dateB = dayjs(b, "YY.MM.DD").valueOf();
      return dateA - dateB;
    });

    const avgData: { x: string; y: number }[] = [];

    sortedDates.forEach((date) => {
      const prices = dateMap.get(date)!;
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      avgData.push({ x: date, y: avg });
    });

    return {
      series: [{ name: "평균 단가", data: avgData }],
      options: {
        chart: {
          type: "line" as const,
          height: 180,
          toolbar: { show: false },
          zoom: { enabled: false },
          sparkline: { enabled: false },
          animations: { enabled: true, speed: 400 },
        },
        stroke: {
          width: 2.5,
          curve: "smooth" as const,
        },
        markers: {
          size: 4,
          hover: { size: 6 },
        },
        grid: {
          show: true,
          borderColor: "#f0f0f0",
          strokeDashArray: 4,
          padding: { left: 10, right: 10 },
        },
        xaxis: {
          type: "category" as const,
          labels: {
            style: { fontSize: "10px", colors: "#9ca3af" },
            rotate: -45,
            rotateAlways: true,
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          labels: {
            formatter: (val: number) => val.toLocaleString() + "원",
            style: { fontSize: "10px", colors: "#9ca3af" },
          },
        },
        tooltip: {
          y: {
            formatter: (val: number) => val.toLocaleString() + "원",
          },
        },
        colors: ["#3B82F6"],
      },
    };
  };

  // 요약 차트 데이터 (평균 추이 + 범위)
  const getSummaryChartData = (group: GroupedProduct) => {
    const dateMap = new Map<string, number[]>();

    group.priceByCompany.forEach((company) => {
      company.priceHistory.forEach((h) => {
        const dateKey = dayjs(h.date).format("YY.MM.DD");
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, []);
        }
        dateMap.get(dateKey)!.push(h.price);
      });
    });

    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
      const dateA = dayjs(a, "YY.MM.DD").valueOf();
      const dateB = dayjs(b, "YY.MM.DD").valueOf();
      return dateA - dateB;
    });

    const avgData: { x: string; y: number }[] = [];
    const minData: { x: string; y: number }[] = [];
    const maxData: { x: string; y: number }[] = [];

    sortedDates.forEach((date) => {
      const prices = dateMap.get(date)!;
      const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      const min = Math.min(...prices);
      const max = Math.max(...prices);

      avgData.push({ x: date, y: avg });
      minData.push({ x: date, y: min });
      maxData.push({ x: date, y: max });
    });

    return {
      series: [
        { name: "평균 단가", data: avgData },
        { name: "최저가", data: minData },
        { name: "최고가", data: maxData },
      ],
      options: {
        chart: {
          type: "line" as const,
          height: 300,
          toolbar: { show: false },
          zoom: { enabled: false },
        },
        stroke: {
          width: [3, 1, 1],
          curve: "smooth" as const,
          dashArray: [0, 5, 5],
        },
        fill: {
          opacity: [1, 0.3, 0.3],
        },
        markers: {
          size: [5, 0, 0],
          hover: { size: 7 },
        },
        xaxis: {
          type: "category" as const,
          labels: {
            style: { fontSize: "11px" },
            rotate: -45,
          },
        },
        yaxis: {
          labels: {
            formatter: (val: number) => val.toLocaleString() + "원",
            style: { fontSize: "11px" },
          },
        },
        tooltip: {
          y: {
            formatter: (val: number) => val.toLocaleString() + "원",
          },
        },
        legend: {
          position: "top" as const,
          fontSize: "12px",
        },
        colors: ["#3B82F6", "#10B981", "#EF4444"],
      },
    };
  };

  // 거래처별 차트 데이터
  const getByCompanyChartData = (group: GroupedProduct) => {
    const companySeries: Record<string, { x: string; y: number }[]> = {};

    group.priceByCompany.forEach((company) => {
      companySeries[company.companyName] = company.priceHistory
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((h) => ({
          x: dayjs(h.date).format("YY.MM.DD"),
          y: h.price,
        }));
    });

    const series = Object.entries(companySeries).map(([name, data]) => ({
      name,
      data,
    }));

    return {
      series,
      options: {
        chart: {
          type: "line" as const,
          height: 300,
          toolbar: { show: false },
          zoom: { enabled: false },
        },
        stroke: {
          width: 2,
          curve: "smooth" as const,
        },
        markers: {
          size: 4,
          hover: { size: 6 },
        },
        xaxis: {
          type: "category" as const,
          labels: {
            style: { fontSize: "11px" },
            rotate: -45,
          },
        },
        yaxis: {
          labels: {
            formatter: (val: number) => val.toLocaleString() + "원",
            style: { fontSize: "11px" },
          },
        },
        tooltip: {
          y: {
            formatter: (val: number) => val.toLocaleString() + "원",
          },
        },
        legend: {
          position: "top" as const,
          fontSize: "12px",
        },
        colors: [
          "#3B82F6",
          "#10B981",
          "#F59E0B",
          "#EF4444",
          "#8B5CF6",
          "#EC4899",
        ],
      },
    };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="flex flex-col justify-center items-center p-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 mt-3">품목을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <EmptyState type="product" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {products.map((group) => {
          const isExpanded = expandedGroups.has(group.groupKey);
          const priceDiff = getPriceDiffPercent(group.latestPrice, group.avgPrice);
          const chartData = getInlineChartData(group);
          const hasChartData = chartData.series[0].data.length >= 2;

          return (
            <div
              key={group.groupKey}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              {/* 헤더: 품목 정보 + 가격 통계 */}
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  {/* 왼쪽: 품목 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800 text-lg truncate">
                        {group.name}
                      </h3>
                      <span className="text-slate-300">|</span>
                      <span className="text-sm text-slate-600">{group.spec}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building2 size={12} />
                        거래처 {group.companyCount}곳
                      </span>
                      <span>총 {group.recordCount}건 거래</span>
                      <span>최근 거래: {dayjs(group.latestDate).format("YYYY.MM.DD")}</span>
                    </div>
                  </div>

                  {/* 오른쪽: 가격 통계 */}
                  <div className="flex items-center gap-6 ml-4">
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-0.5">최신 단가</div>
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-blue-600 text-lg">
                          {formatPrice(group.latestPrice)}
                        </span>
                        {priceDiff !== 0 && (
                          <span
                            className={`flex items-center text-xs ${
                              priceDiff > 0 ? "text-red-500" : "text-green-500"
                            }`}
                          >
                            {priceDiff > 0 ? (
                              <TrendingUp size={12} />
                            ) : (
                              <TrendingDown size={12} />
                            )}
                            {Math.abs(priceDiff)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-0.5">평균</div>
                      <span className="font-medium text-slate-700">
                        {formatPrice(group.avgPrice)}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-0.5">최저</div>
                      <span className="font-medium text-green-600">
                        {formatPrice(group.minPrice)}
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500 mb-0.5">최고</div>
                      <span className="font-medium text-red-600">
                        {formatPrice(group.maxPrice)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setChartGroup(group);
                        setChartViewMode("summary");
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="상세 차트 보기"
                    >
                      <Maximize2 size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* 차트 영역 */}
              <div className="px-4 py-2">
                {hasChartData ? (
                  <ApexChart
                    options={chartData.options}
                    series={chartData.series}
                    type="line"
                    height={180}
                  />
                ) : (
                  <div className="flex items-center justify-center h-[180px] text-slate-400 text-sm">
                    차트 데이터가 부족합니다 (최소 2개 이상 필요)
                  </div>
                )}
              </div>

              {/* 거래처 펼치기/접기 */}
              <div className="border-t border-slate-100">
                <button
                  onClick={() => toggleGroup(group.groupKey)}
                  className="w-full px-5 py-2.5 flex items-center justify-center gap-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Building2 size={14} />
                  거래처별 단가 ({group.companyCount}곳)
                  {isExpanded ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>

                {/* 확장된 거래처 목록 */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-slate-50 border-t border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {group.priceByCompany.map((company) => (
                        <div
                          key={company.companyName}
                          className="bg-white rounded-md border border-slate-200 px-3 py-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (company.companyId) {
                                    router.push(
                                      `/consultations/${company.companyId}`
                                    );
                                  }
                                }}
                                className="text-sm font-medium text-blue-600 hover:underline"
                              >
                                {company.companyName}
                              </button>
                              <span className="text-xs text-slate-400">
                                ({company.priceHistory.length}건)
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-medium text-slate-800">
                                {formatPrice(company.latestPrice)}
                              </span>
                              <span className="text-xs text-slate-500 ml-2">
                                ({dayjs(company.latestDate).format("YY.MM.DD")})
                              </span>
                            </div>
                          </div>

                          {/* 가격 히스토리 */}
                          {company.priceHistory.length >= 1 && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                              <div className="text-[10px] text-slate-400 mb-1.5 flex items-center gap-1">
                                <FileText size={10} />
                                거래 내역 (클릭하여 문서 보기)
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {company.priceHistory.slice(0, 4).map((history, idx) => (
                                  <button
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDocumentClick?.(history.documentId);
                                    }}
                                    className="group inline-flex items-center text-xs bg-blue-50 text-slate-700 px-2.5 py-1.5 rounded-md border border-blue-200 hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                                    title="클릭하여 문서 보기"
                                  >
                                    <FileText size={11} className="mr-1.5 text-blue-500 group-hover:text-blue-600" />
                                    <Calendar size={10} className="mr-1 text-slate-400" />
                                    {dayjs(history.date).format("YY.MM.DD")}
                                    <span className="mx-1.5 text-slate-300">|</span>
                                    <span className="font-medium text-blue-600">{history.quantity}{history.unit}</span>
                                    <span className="mx-1.5 text-slate-300">@</span>
                                    <span className="font-medium">{formatPrice(history.price)}</span>
                                  </button>
                                ))}
                                {company.priceHistory.length > 4 && (
                                  <span className="text-xs text-slate-400 px-1 self-center">
                                    +{company.priceHistory.length - 4}건 더보기
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 상세 차트 모달 */}
      {chartGroup && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setChartGroup(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-[66vw] max-w-6xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-semibold text-slate-800">
                  {chartGroup.name} 단가 추이
                </h3>
                <p className="text-sm text-slate-500">{chartGroup.spec}</p>
              </div>
              <button
                onClick={() => setChartGroup(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {/* 요약 정보 */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-slate-50 rounded-md p-3 text-center">
                  <div className="text-xs text-slate-500">최신 단가</div>
                  <div className="font-semibold text-blue-600">
                    {formatPrice(chartGroup.latestPrice)}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-md p-3 text-center">
                  <div className="text-xs text-slate-500">평균 단가</div>
                  <div className="font-semibold text-slate-700">
                    {formatPrice(chartGroup.avgPrice)}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-md p-3 text-center">
                  <div className="text-xs text-slate-500">최저가</div>
                  <div className="font-semibold text-green-600">
                    {formatPrice(chartGroup.minPrice)}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-md p-3 text-center">
                  <div className="text-xs text-slate-500">최고가</div>
                  <div className="font-semibold text-red-600">
                    {formatPrice(chartGroup.maxPrice)}
                  </div>
                </div>
              </div>

              {/* 차트 뷰 모드 토글 */}
              {chartGroup.companyCount > 1 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center bg-slate-100 rounded-md p-0.5">
                    <button
                      onClick={() => setChartViewMode("summary")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                        chartViewMode === "summary"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <BarChart3 size={14} />
                      평균 추이
                    </button>
                    <button
                      onClick={() => setChartViewMode("byCompany")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                        chartViewMode === "byCompany"
                          ? "bg-white text-slate-800 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <Users size={14} />
                      거래처별
                    </button>
                  </div>
                  <span className="text-xs text-slate-500">
                    {chartViewMode === "summary"
                      ? "평균 단가와 범위를 표시합니다"
                      : "각 거래처별 단가를 비교합니다"}
                  </span>
                </div>
              )}

              {/* 차트 */}
              <div className="border rounded-xl p-3">
                {(() => {
                  const modalChartData =
                    chartViewMode === "summary" || chartGroup.companyCount === 1
                      ? chartGroup.companyCount === 1
                        ? getByCompanyChartData(chartGroup)
                        : getSummaryChartData(chartGroup)
                      : getByCompanyChartData(chartGroup);
                  return (
                    <ApexChart
                      options={modalChartData.options}
                      series={modalChartData.series}
                      type="line"
                      height={300}
                    />
                  );
                })()}
              </div>

              {/* 거래처별 최신 단가 */}
              <div className="mt-4">
                <div className="text-sm font-medium text-slate-700 mb-2">
                  거래처별 최신 단가 ({chartGroup.companyCount}곳)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {chartGroup.priceByCompany.map((company) => (
                    <div
                      key={company.companyName}
                      className="flex items-center justify-between bg-slate-50 rounded-md px-3 py-2"
                    >
                      <span className="text-sm text-slate-700 truncate">
                        {company.companyName}
                      </span>
                      <span className="font-medium text-slate-800 ml-2">
                        {formatPrice(company.latestPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
