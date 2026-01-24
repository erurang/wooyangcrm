import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type Urgency = "critical" | "high" | "medium" | "low";

export interface AutoOrderSuggestion {
  productId: string;
  productCode: string;
  productName: string;
  productType: string;
  currentStock: number;
  minStock: number | null;
  unit: string;
  avgDailyConsumption: number;
  daysUntilStockout: number | null;
  suggestedOrderQuantity: number;
  urgency: Urgency;
  last90DaysOutbound: number;
  lastOrderDate: string | null;
  preferredSupplier: {
    id: string;
    name: string;
  } | null;
}

export interface AutoOrderSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  totalSuggestedItems: number;
}

export interface CalculationParams {
  targetStockDays: number;
  analysisRange: string;
  calculatedAt: string;
}

interface AutoOrderResponse {
  suggestions: AutoOrderSuggestion[];
  summary: AutoOrderSummary;
  calculationParams: CalculationParams;
  error?: string;
}

export interface AutoOrderFilters {
  type?: "raw_material" | "purchased" | "finished";
  urgency?: Urgency;
  targetDays?: number;
}

/**
 * 자동 발주 권장 목록 조회 훅
 *
 * @param filters - 필터 옵션
 * @returns 발주 권장 목록, 요약, 로딩/에러 상태
 */
export function useAutoOrderSuggestions(filters?: AutoOrderFilters) {
  const params = new URLSearchParams();

  if (filters?.type) {
    params.set("type", filters.type);
  }
  if (filters?.urgency) {
    params.set("urgency", filters.urgency);
  }
  if (filters?.targetDays) {
    params.set("targetDays", filters.targetDays.toString());
  }

  const queryString = params.toString();
  const url = `/api/inventory/auto-order-suggestions${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<AutoOrderResponse>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60 * 1000, // 1분간 중복 요청 방지
      errorRetryCount: 2,
    }
  );

  return {
    suggestions: data?.suggestions || [],
    summary: data?.summary || {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      totalSuggestedItems: 0,
    },
    calculationParams: data?.calculationParams,
    isLoading,
    isError: !!error || !!data?.error,
    error: error ? "조회 실패" : data?.error,
    mutate,
  };
}

// 긴급도별 색상 유틸리티
export function getUrgencyColor(urgency: Urgency): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (urgency) {
    case "critical":
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        border: "border-red-300",
        dot: "bg-red-500",
      };
    case "high":
      return {
        bg: "bg-orange-100",
        text: "text-orange-700",
        border: "border-orange-300",
        dot: "bg-orange-500",
      };
    case "medium":
      return {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        border: "border-yellow-300",
        dot: "bg-yellow-500",
      };
    case "low":
      return {
        bg: "bg-green-100",
        text: "text-green-700",
        border: "border-green-300",
        dot: "bg-green-500",
      };
  }
}

// 긴급도 라벨
export function getUrgencyLabel(urgency: Urgency): string {
  switch (urgency) {
    case "critical":
      return "긴급";
    case "high":
      return "높음";
    case "medium":
      return "보통";
    case "low":
      return "낮음";
  }
}

// 제품 타입 라벨
export function getProductTypeLabel(type: string): string {
  switch (type) {
    case "raw_material":
      return "원자재";
    case "purchased":
      return "구매품";
    case "finished":
      return "완제품";
    default:
      return type;
  }
}

// 제품 타입 색상
export function getProductTypeColor(type: string): {
  bg: string;
  text: string;
} {
  switch (type) {
    case "raw_material":
      return { bg: "bg-blue-100", text: "text-blue-700" };
    case "purchased":
      return { bg: "bg-purple-100", text: "text-purple-700" };
    case "finished":
      return { bg: "bg-emerald-100", text: "text-emerald-700" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-700" };
  }
}
