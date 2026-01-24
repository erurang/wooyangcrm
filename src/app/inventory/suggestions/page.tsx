"use client";

import React, { useState } from "react";
import {
  Package,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  ShoppingCart,
  Filter,
  Calendar,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Box,
  Layers,
  BarChart3,
} from "lucide-react";
import {
  useAutoOrderSuggestions,
  getUrgencyColor,
  getUrgencyLabel,
  getProductTypeLabel,
  getProductTypeColor,
  type Urgency,
  type AutoOrderFilters,
} from "@/hooks/useAutoOrderSuggestions";

type ProductType = "raw_material" | "purchased" | "finished";

export default function AutoOrderSuggestionsPage() {
  const [filters, setFilters] = useState<AutoOrderFilters>({
    targetDays: 30,
  });
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const { suggestions, summary, calculationParams, isLoading, mutate } =
    useAutoOrderSuggestions(filters);

  const urgencyOptions: { value: Urgency | ""; label: string }[] = [
    { value: "", label: "전체 긴급도" },
    { value: "critical", label: "긴급" },
    { value: "high", label: "높음" },
    { value: "medium", label: "보통" },
    { value: "low", label: "낮음" },
  ];

  const typeOptions: { value: ProductType | ""; label: string }[] = [
    { value: "", label: "전체 제품" },
    { value: "raw_material", label: "원자재" },
    { value: "purchased", label: "구매품" },
    { value: "finished", label: "완제품" },
  ];

  const handleFilterChange = (key: keyof AutoOrderFilters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value,
    }));
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">재고 예측 & 발주 권장</h1>
            <p className="text-sm text-gray-500">
              출고 이력 기반 소모량 분석 및 자동 발주 권장
            </p>
          </div>
        </div>

        <button
          onClick={() => mutate()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          새로고침
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-500 mb-1">전체 권장</div>
          <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <div className="text-sm text-red-600 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            긴급
          </div>
          <div className="text-2xl font-bold text-red-700">{summary.critical}</div>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4">
          <div className="text-sm text-orange-600 mb-1">높음</div>
          <div className="text-2xl font-bold text-orange-700">{summary.high}</div>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <div className="text-sm text-yellow-600 mb-1">보통</div>
          <div className="text-2xl font-bold text-yellow-700">{summary.medium}</div>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <div className="text-sm text-green-600 mb-1">낮음</div>
          <div className="text-2xl font-bold text-green-700">{summary.low}</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">필터</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">긴급도</label>
            <select
              value={filters.urgency || ""}
              onChange={(e) => handleFilterChange("urgency", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {urgencyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">제품 유형</label>
            <select
              value={filters.type || ""}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">목표 재고일수</label>
            <select
              value={filters.targetDays || 30}
              onChange={(e) => handleFilterChange("targetDays", parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value={14}>14일</option>
              <option value={30}>30일</option>
              <option value={60}>60일</option>
              <option value={90}>90일</option>
            </select>
          </div>
        </div>
        {calculationParams && (
          <div className="mt-3 pt-3 border-t text-xs text-gray-400 flex items-center gap-4">
            <span>분석 기간: {calculationParams.analysisRange}</span>
            <span>목표 재고: {calculationParams.targetStockDays}일</span>
            <span>
              갱신: {new Date(calculationParams.calculatedAt).toLocaleString("ko-KR")}
            </span>
          </div>
        )}
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-amber-600 animate-spin" />
          <span className="ml-3 text-gray-500">분석 중...</span>
        </div>
      )}

      {/* 결과 테이블 */}
      {!isLoading && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 w-12">
                    #
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                    제품
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">
                    긴급도
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">
                    현재 재고
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">
                    일평균 소모
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">
                    소진 예상
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">
                    권장 발주량
                  </th>
                </tr>
              </thead>
              <tbody>
                {suggestions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>발주 권장 항목이 없습니다.</p>
                      <p className="text-sm text-gray-400 mt-1">
                        재고가 충분하거나 출고 이력이 없습니다.
                      </p>
                    </td>
                  </tr>
                ) : (
                  suggestions.map((item, index) => {
                    const urgencyColor = getUrgencyColor(item.urgency);
                    const typeColor = getProductTypeColor(item.productType);
                    const isExpanded = expandedProduct === item.productId;

                    return (
                      <React.Fragment key={item.productId}>
                        <tr
                          onClick={() =>
                            setExpandedProduct(isExpanded ? null : item.productId)
                          }
                          className={`hover:bg-gray-50 transition-colors cursor-pointer border-b ${
                            isExpanded ? "bg-amber-50" : ""
                          }`}
                        >
                          <td className="py-3 px-3 text-center text-sm text-gray-500 font-medium">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`transition-transform duration-200 ${
                                  isExpanded ? "rotate-90" : ""
                                }`}
                              >
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {item.productName}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500 font-mono">
                                    {item.productCode}
                                  </span>
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded ${typeColor.bg} ${typeColor.text}`}
                                  >
                                    {getProductTypeLabel(item.productType)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${urgencyColor.bg} ${urgencyColor.text}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${urgencyColor.dot}`} />
                              {getUrgencyLabel(item.urgency)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`font-medium ${
                                item.currentStock === 0
                                  ? "text-red-600"
                                  : item.minStock && item.currentStock < item.minStock
                                    ? "text-orange-600"
                                    : "text-gray-900"
                              }`}
                            >
                              {item.currentStock.toLocaleString()}
                            </span>
                            <span className="text-gray-500 text-sm ml-1">{item.unit}</span>
                            {item.minStock && (
                              <div className="text-xs text-gray-400">
                                최소: {item.minStock.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-sm text-gray-700">
                            {item.avgDailyConsumption > 0 ? (
                              <>
                                {item.avgDailyConsumption.toFixed(1)}
                                <span className="text-gray-400 ml-1">{item.unit}/일</span>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {item.daysUntilStockout !== null ? (
                              <span
                                className={`font-medium ${
                                  item.daysUntilStockout <= 7
                                    ? "text-red-600"
                                    : item.daysUntilStockout <= 14
                                      ? "text-orange-600"
                                      : item.daysUntilStockout <= 30
                                        ? "text-yellow-600"
                                        : "text-gray-700"
                                }`}
                              >
                                {item.daysUntilStockout}일
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-amber-600">
                              {item.suggestedOrderQuantity.toLocaleString()}
                            </span>
                            <span className="text-gray-500 text-sm ml-1">{item.unit}</span>
                          </td>
                        </tr>

                        {/* 확장 영역 */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="p-0 bg-gray-50 border-b">
                              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* 소모 분석 */}
                                <div className="bg-white rounded-lg p-4 border">
                                  <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
                                    <BarChart3 className="w-4 h-4 text-blue-500" />
                                    소모 분석 (90일)
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">총 출고량</span>
                                      <span className="font-medium">
                                        {item.last90DaysOutbound.toLocaleString()} {item.unit}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">일평균 소모</span>
                                      <span className="font-medium">
                                        {item.avgDailyConsumption.toFixed(2)} {item.unit}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">월평균 소모</span>
                                      <span className="font-medium">
                                        {(item.avgDailyConsumption * 30).toFixed(0)} {item.unit}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* 재고 상태 */}
                                <div className="bg-white rounded-lg p-4 border">
                                  <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
                                    <Layers className="w-4 h-4 text-green-500" />
                                    재고 상태
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">현재 재고</span>
                                      <span className="font-medium">
                                        {item.currentStock.toLocaleString()} {item.unit}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">최소 재고</span>
                                      <span className="font-medium">
                                        {item.minStock?.toLocaleString() || "-"} {item.unit}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">소진 예상일</span>
                                      <span
                                        className={`font-medium ${
                                          item.daysUntilStockout !== null &&
                                          item.daysUntilStockout <= 14
                                            ? "text-red-600"
                                            : ""
                                        }`}
                                      >
                                        {item.daysUntilStockout !== null
                                          ? `${item.daysUntilStockout}일 후`
                                          : "계산 불가"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* 발주 권장 */}
                                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                                  <div className="flex items-center gap-2 mb-3 text-sm font-medium text-amber-700">
                                    <ShoppingCart className="w-4 h-4" />
                                    발주 권장
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-amber-600">권장 수량</span>
                                      <span className="font-bold text-amber-700">
                                        {item.suggestedOrderQuantity.toLocaleString()} {item.unit}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-amber-600">마지막 입고</span>
                                      <span className="font-medium text-amber-700">
                                        {item.lastOrderDate || "기록 없음"}
                                      </span>
                                    </div>
                                    {item.preferredSupplier && (
                                      <div className="flex justify-between">
                                        <span className="text-amber-600">선호 거래처</span>
                                        <span className="font-medium text-amber-700">
                                          {item.preferredSupplier.name}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <button className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
                                    <ShoppingCart className="w-4 h-4" />
                                    발주 요청
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
