"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import dayjs from "dayjs";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Calendar,
  X,
  Search,
  FileText,
  Maximize2,
  Filter,
  XCircle,
} from "lucide-react";
import { useCompanyProducts } from "@/hooks/products/useCompanyProducts";
import { useDebounce } from "@/hooks/useDebounce";
import EmptyState from "@/components/ui/EmptyState";
import { ProductDocumentModal } from "@/components/products/unit";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface PriceHistory {
  price: number;
  quantity: string;
  unit: string;
  date: string;
  documentNumber: string;
  documentId: string;
  type: string;
}

interface GroupedProduct {
  groupKey: string;
  name: string;
  spec: string;
  recordCount: number;
  latestPrice: number;
  latestDate: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  priceHistory: PriceHistory[];
}

interface CompanyPriceTabProps {
  companyId: string;
}

export default function CompanyPriceTab({ companyId }: CompanyPriceTabProps) {
  const [searchProduct, setSearchProduct] = useState("");
  const [searchSpec, setSearchSpec] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [chartGroup, setChartGroup] = useState<GroupedProduct | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<"estimate" | "order">("estimate");

  const debouncedProduct = useDebounce(searchProduct, 300);
  const debouncedSpec = useDebounce(searchSpec, 300);

  // ESC 키로 모달 닫기
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && chartGroup) {
      setChartGroup(null);
    }
  }, [chartGroup]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const { products, total, isLoading } = useCompanyProducts({
    companyId,
    searchProduct: debouncedProduct,
    searchSpec: debouncedSpec,
  });

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

  const getTypeLabel = (type: string) => {
    return type === "estimate" ? "견적" : type === "order" ? "발주" : type;
  };

  const getTypeColor = (type: string) => {
    return type === "estimate"
      ? "bg-sky-100 text-sky-700"
      : type === "order"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-100 text-slate-700";
  };

  // 인라인 차트용 데이터
  const getInlineChartData = (group: GroupedProduct) => {
    const sortedHistory = [...group.priceHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      series: [
        {
          name: "단가",
          data: sortedHistory.map((h) => ({
            x: dayjs(h.date).format("YY.MM.DD"),
            y: h.price,
          })),
        },
      ],
      options: {
        chart: {
          type: "line" as const,
          height: 160,
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

  // 모달 차트 데이터
  const getChartData = (group: GroupedProduct) => {
    const sortedHistory = [...group.priceHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      series: [
        {
          name: "단가",
          data: sortedHistory.map((h) => ({
            x: dayjs(h.date).format("YY.MM.DD"),
            y: h.price,
          })),
        },
      ],
      options: {
        chart: {
          type: "line" as const,
          height: 300,
          toolbar: { show: false },
          zoom: { enabled: false },
        },
        stroke: {
          width: 2.5,
          curve: "smooth" as const,
        },
        markers: {
          size: 5,
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
        colors: ["#3B82F6"],
      },
    };
  };

  const handleDocumentClick = (documentId: string, type: string) => {
    setSelectedDocumentId(documentId);
    setSelectedDocumentType(type as "estimate" | "order");
  };

  const hasSearchFilter = searchProduct || searchSpec;
  const clearFilters = () => {
    setSearchProduct("");
    setSearchSpec("");
  };

  return (
    <div>
      {/* 상단 헤더: 총 개수 + 검색 필터 */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-slate-600">
          총 <span className="font-semibold text-sky-600">{total}</span>개의 품목
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              placeholder="품명"
              className="w-28 pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchSpec}
              onChange={(e) => setSearchSpec(e.target.value)}
              placeholder="규격"
              className="w-28 pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:border-sky-500 bg-slate-50"
            />
          </div>
          {hasSearchFilter && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="필터 초기화"
            >
              <XCircle size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col justify-center items-center">
            <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 mt-3">품목을 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {!isLoading && products.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <EmptyState type="product" />
        </div>
      )}

      {/* 품목 목록 */}
      {!isLoading && products.length > 0 && (
        <div className="space-y-4">
          {products.map((group: GroupedProduct) => {
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
                        {group.spec && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="text-sm text-slate-600">{group.spec}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>총 {group.recordCount}건 거래</span>
                        <span>최근 거래: {dayjs(group.latestDate).format("YYYY.MM.DD")}</span>
                      </div>
                    </div>

                    {/* 오른쪽: 가격 통계 */}
                    <div className="flex items-center gap-6 ml-4">
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-0.5">최신 단가</div>
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-bold text-sky-600 text-lg">
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
                        onClick={() => setChartGroup(group)}
                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
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
                      height={160}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[160px] text-slate-400 text-sm">
                      차트 데이터가 부족합니다 (최소 2개 이상 필요)
                    </div>
                  )}
                </div>

                {/* 거래 이력 펼치기/접기 */}
                <div className="border-t border-slate-100">
                  <button
                    onClick={() => toggleGroup(group.groupKey)}
                    className="w-full px-5 py-2.5 flex items-center justify-center gap-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <FileText size={14} />
                    거래 이력 ({group.recordCount}건)
                    {isExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>

                  {/* 확장된 거래 이력 - 인라인 버튼 스타일 */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100">
                      <div className="text-[10px] text-slate-400 mb-2 flex items-center gap-1">
                        <FileText size={10} />
                        거래 내역 (클릭하여 문서 보기)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.priceHistory.slice(0, 8).map((history, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleDocumentClick(history.documentId, history.type)}
                            className="group inline-flex items-center text-xs bg-sky-50 text-slate-700 px-2.5 py-1.5 rounded-lg border border-sky-200 hover:bg-sky-100 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer"
                            title="클릭하여 문서 보기"
                          >
                            <FileText size={11} className="mr-1.5 text-sky-500 group-hover:text-sky-600" />
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium mr-1.5 ${getTypeColor(
                                history.type
                              )}`}
                            >
                              {getTypeLabel(history.type)}
                            </span>
                            <Calendar size={10} className="mr-1 text-slate-400" />
                            {dayjs(history.date).format("YY.MM.DD")}
                            <span className="mx-1.5 text-slate-300">|</span>
                            <span className="font-medium text-sky-600">{history.quantity}{history.unit}</span>
                            <span className="mx-1.5 text-slate-300">@</span>
                            <span className="font-medium">{formatPrice(history.price)}</span>
                          </button>
                        ))}
                        {group.priceHistory.length > 8 && (
                          <span className="text-xs text-slate-400 px-1 self-center">
                            +{group.priceHistory.length - 8}건 더보기
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h3 className="font-semibold text-slate-800">
                  {chartGroup.name} 단가 추이
                </h3>
                <p className="text-sm text-slate-500">{chartGroup.spec}</p>
              </div>
              <button
                onClick={() => setChartGroup(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {/* 요약 정보 */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500">최신 단가</div>
                  <div className="font-semibold text-sky-600">
                    {formatPrice(chartGroup.latestPrice)}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500">평균 단가</div>
                  <div className="font-semibold text-slate-700">
                    {formatPrice(chartGroup.avgPrice)}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500">최저가</div>
                  <div className="font-semibold text-green-600">
                    {formatPrice(chartGroup.minPrice)}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-500">최고가</div>
                  <div className="font-semibold text-red-600">
                    {formatPrice(chartGroup.maxPrice)}
                  </div>
                </div>
              </div>

              {/* 차트 */}
              <div className="border border-slate-200 rounded-xl p-3">
                {(() => {
                  const modalChartData = getChartData(chartGroup);
                  return (
                    <ApexChart
                      options={modalChartData.options}
                      series={modalChartData.series}
                      type="line"
                      height={280}
                    />
                  );
                })()}
              </div>

              {/* 거래 이력 - 인라인 버튼 스타일 */}
              <div className="mt-4">
                <div className="text-[10px] text-slate-400 mb-2 flex items-center gap-1">
                  <FileText size={10} />
                  거래 내역 ({chartGroup.recordCount}건) - 클릭하여 문서 보기
                </div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                  {chartGroup.priceHistory.map((history, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setChartGroup(null);
                        handleDocumentClick(history.documentId, history.type);
                      }}
                      className="group inline-flex items-center text-xs bg-sky-50 text-slate-700 px-2.5 py-1.5 rounded-lg border border-sky-200 hover:bg-sky-100 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer"
                      title="클릭하여 문서 보기"
                    >
                      <FileText size={11} className="mr-1.5 text-sky-500 group-hover:text-sky-600" />
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium mr-1.5 ${getTypeColor(
                          history.type
                        )}`}
                      >
                        {getTypeLabel(history.type)}
                      </span>
                      <Calendar size={10} className="mr-1 text-slate-400" />
                      {dayjs(history.date).format("YY.MM.DD")}
                      <span className="mx-1.5 text-slate-300">|</span>
                      <span className="font-medium text-sky-600">{history.quantity}{history.unit}</span>
                      <span className="mx-1.5 text-slate-300">@</span>
                      <span className="font-medium">{formatPrice(history.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 문서 상세 모달 */}
      <ProductDocumentModal
        documentId={selectedDocumentId}
        type={selectedDocumentType}
        onClose={() => setSelectedDocumentId(null)}
      />
    </div>
  );
}
