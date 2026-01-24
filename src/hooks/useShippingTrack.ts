import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { CarrierCode, TrackingResult, TrackingEvent } from "@/lib/carriers";
import {
  CARRIERS,
  CARRIER_OPTIONS,
  DOMESTIC_CARRIER_OPTIONS,
  INTERNATIONAL_CARRIER_OPTIONS,
  getStatusText,
  getStatusColor,
} from "@/lib/carriers";

export type { CarrierCode, TrackingResult, TrackingEvent };
export {
  CARRIERS,
  CARRIER_OPTIONS,
  DOMESTIC_CARRIER_OPTIONS,
  INTERNATIONAL_CARRIER_OPTIONS,
  getStatusText,
  getStatusColor,
};

/**
 * 배송 추적 훅
 */
export function useShippingTrack(
  carrier?: CarrierCode,
  trackingNumber?: string
) {
  const shouldFetch = carrier && trackingNumber;
  const url = shouldFetch
    ? `/api/shipping/track?carrier=${carrier}&trackingNumber=${trackingNumber}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<TrackingResult>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // 1분마다 갱신
      dedupingInterval: 30000, // 30초간 중복 요청 방지
    }
  );

  return {
    tracking: data,
    isLoading,
    isError: !!error,
    mutate,
  };
}

/**
 * 수동 배송 등록
 */
export async function registerShipping(data: {
  orderId?: string;
  orderType?: "outbound" | "overseas_order";
  carrier: CarrierCode;
  trackingNumber: string;
  origin?: string;
  destination?: string;
  eta?: string;
  status?: TrackingResult["status"];
  timeline?: TrackingEvent[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/shipping/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || "등록에 실패했습니다." };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "등록 중 오류가 발생했습니다." };
  }
}

/**
 * 배송 조회 (비훅 버전)
 */
export async function trackShipment(
  carrier: CarrierCode,
  trackingNumber: string
): Promise<TrackingResult> {
  const response = await fetch(
    `/api/shipping/track?carrier=${carrier}&trackingNumber=${trackingNumber}`
  );
  return response.json();
}
