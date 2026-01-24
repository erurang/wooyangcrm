import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface FedExShipment {
  trackingNumber: string;
  status: string;
  statusDescription: string;
  shipDate: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  origin: {
    city: string;
    country: string;
  };
  destination: {
    city: string;
    country: string;
  };
  service: string;
  weight?: string;
}

interface FedExShipmentsResponse {
  shipments: FedExShipment[];
  count: number;
  error?: string;
}

// FedEx 배송 리스트 조회
export function useFedExShipments(days: number = 30) {
  const { data, error, isLoading, mutate } = useSWR<FedExShipmentsResponse>(
    `/api/fedex/shipments?days=${days}`,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분간 중복 요청 방지
    }
  );

  return {
    shipments: data?.shipments || [],
    count: data?.count || 0,
    error: data?.error || (error ? "조회 실패" : undefined),
    isLoading,
    mutate,
  };
}

// FedEx 상태 색상
export function getFedExStatusColor(status: string): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (status) {
    case "PU": // Picked Up
      return { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" };
    case "IT": // In Transit
    case "DP": // Departed
    case "AR": // Arrived
      return { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" };
    case "OD": // Out for Delivery
      return { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" };
    case "DL": // Delivered
      return { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" };
    case "DE": // Delay
      return { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" };
    case "CA": // Cancelled
      return { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
  }
}

// FedEx 상태 한글 변환
export function getFedExStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PU: "픽업 완료",
    IT: "운송 중",
    DP: "출발",
    AR: "도착",
    OD: "배송 출발",
    DL: "배송 완료",
    DE: "지연",
    CA: "취소됨",
  };
  return statusMap[status] || status;
}
