"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Package,
  TrendingDown,
  Clock,
  Building2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import {
  useAutoOrderSuggestions,
  getUrgencyColor,
  getUrgencyLabel,
  type Urgency,
} from "@/hooks/useAutoOrderSuggestions";

interface AutoOrderSuggestionsProps {
  compact?: boolean;
  onCreateOrder?: (productId: string, quantity: number, supplierId?: string) => void;
}

export default function AutoOrderSuggestions({
  compact = false,
  onCreateOrder,
}: AutoOrderSuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [selectedUrgency, setSelectedUrgency] = useState<Urgency | undefined>(undefined);

  const { suggestions, summary, isLoading, mutate } = useAutoOrderSuggestions({
    targetDays: 30,
    urgency: selectedUrgency,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* 헤더 */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 ${
          compact ? "cursor-pointer hover:bg-slate-50" : ""
        }`}
        onClick={() => compact && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
          <h3 className="font-semibold text-slate-800">발주 권장</h3>
          {summary.total > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
              {summary.total}건
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 긴급도 필터 */}
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUrgency(undefined);
              }}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                !selectedUrgency
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              전체
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUrgency("high");
              }}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedUrgency === "high"
                  ? "bg-red-600 text-white"
                  : "text-red-600 hover:bg-red-50"
              }`}
            >
              긴급 {summary.high > 0 && `(${summary.high})`}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedUrgency("medium");
              }}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedUrgency === "medium"
                  ? "bg-orange-600 text-white"
                  : "text-orange-600 hover:bg-orange-50"
              }`}
            >
              주의 {summary.medium > 0 && `(${summary.medium})`}
            </button>
          </div>

          {/* 새로고침 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              mutate();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
            title="새로고침"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {compact && (
            <button className="p-1 hover:bg-slate-100 rounded">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {suggestions.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">발주 권장 제품이 없습니다</p>
                <p className="text-slate-400 text-xs mt-1">
                  모든 제품의 재고가 충분합니다
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {suggestions.map((item) => {
                  const urgencyColor = getUrgencyColor(item.urgency);

                  return (
                    <div
                      key={item.productId}
                      className={`p-3 hover:bg-slate-50 transition-colors ${urgencyColor.bg}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* 제품 정보 */}
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${urgencyColor.text} ${urgencyColor.border} border`}
                            >
                              {getUrgencyLabel(item.urgency)}
                            </span>
                            <span className="text-xs text-slate-500">
                              {item.productCode}
                            </span>
                          </div>
                          <p className="font-medium text-slate-800 truncate">
                            {item.productName}
                          </p>
                          {item.productType && (
                            <p className="text-xs text-slate-500">{item.productType}</p>
                          )}

                          {/* 재고 정보 */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3 text-slate-400" />
                              <span className="text-slate-600">
                                현재:{" "}
                                <span
                                  className={
                                    item.minStock !== null && item.currentStock < item.minStock
                                      ? "text-red-600 font-medium"
                                      : ""
                                  }
                                >
                                  {item.currentStock}
                                </span>
                                {item.unit}
                              </span>
                              <span className="text-slate-400">
                                (최소 {item.minStock})
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingDown className="h-3 w-3 text-slate-400" />
                              <span className="text-slate-600">
                                일평균 소모: {item.avgDailyConsumption}
                                {item.unit}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span
                                className={`${
                                  item.daysUntilStockout !== null && item.daysUntilStockout <= 7
                                    ? "text-red-600 font-medium"
                                    : "text-slate-600"
                                }`}
                              >
                                {item.daysUntilStockout === null || item.daysUntilStockout > 999
                                  ? "충분"
                                  : `${item.daysUntilStockout}일 후 소진`}
                              </span>
                            </div>
                          </div>

                          {/* 선호 거래처 */}
                          {item.preferredSupplier && (
                            <div className="flex items-center gap-1 mt-1 text-xs">
                              <Building2 className="h-3 w-3 text-slate-400" />
                              <span className="text-slate-500">
                                최근 구매처: {item.preferredSupplier.name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 권장 발주량 */}
                        <div className="text-right shrink-0">
                          <div className="text-xs text-slate-500 mb-1">권장 발주량</div>
                          <div className="text-lg font-bold text-blue-600">
                            {item.suggestedOrderQuantity.toLocaleString()}
                            <span className="text-sm font-normal text-slate-500 ml-0.5">
                              {item.unit}
                            </span>
                          </div>
                          {onCreateOrder && (
                            <button
                              onClick={() =>
                                onCreateOrder(
                                  item.productId,
                                  item.suggestedOrderQuantity,
                                  item.preferredSupplier?.id
                                )
                              }
                              className="mt-2 flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              <ShoppingCart className="h-3 w-3" />
                              발주하기
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
