import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type {
  ShippingTracking,
  ShippingTrackingFormData,
  CarrierType,
} from "@/types/shipping";

interface ShippingTrackingResponse {
  trackings: ShippingTracking[];
  count: number;
  error?: string;
}

/**
 * 배송 추적 목록 조회 Hook
 */
export function useShippingTrackings(carrier?: CarrierType) {
  const url = carrier
    ? `/api/shipping/tracking?carrier=${carrier}`
    : `/api/shipping/tracking`;

  const { data, error, isLoading, mutate } = useSWR<ShippingTrackingResponse>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    trackings: data?.trackings || [],
    count: data?.count || 0,
    error: data?.error || (error ? "조회 실패" : undefined),
    isLoading,
    mutate,
  };
}

/**
 * 배송 추적 등록
 */
export async function addShippingTracking(
  data: ShippingTrackingFormData
): Promise<{ success: boolean; tracking?: ShippingTracking; error?: string }> {
  try {
    const response = await fetch("/api/shipping/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error };
    }

    return { success: true, tracking: result.tracking };
  } catch (error) {
    console.error("Error adding shipping tracking:", error);
    return { success: false, error: "등록 실패" };
  }
}

/**
 * 배송 추적 삭제
 */
export async function deleteShippingTracking(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/shipping/tracking/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting shipping tracking:", error);
    return { success: false, error: "삭제 실패" };
  }
}

/**
 * 배송 추적 상태 업데이트 (FedEx 조회 결과 반영)
 */
export async function updateShippingTrackingStatus(
  id: string,
  updates: Partial<ShippingTracking>
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/shipping/tracking/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating shipping tracking:", error);
    return { success: false, error: "업데이트 실패" };
  }
}

// FedEx 상세 조회 결과 타입
export interface FedExTrackingDetail {
  success: boolean;
  trackingNumber: string;
  carrier: string;
  carrierName: string;
  status: string;
  statusText: string;
  eta?: string;
  timeline: Array<{
    date: string;
    time: string;
    status: string;
    location: string;
    description: string;
  }>;
  error?: string;
  shipper?: {
    contact?: { companyName?: string; personName?: string; phoneNumber?: string };
    address?: {
      city?: string;
      stateOrProvince?: string;
      postalCode?: string;
      countryCode?: string;
      countryName?: string;
      streetLines?: string[];
    };
  };
  recipient?: {
    contact?: { companyName?: string; personName?: string; phoneNumber?: string };
    address?: {
      city?: string;
      stateOrProvince?: string;
      postalCode?: string;
      countryCode?: string;
      countryName?: string;
      streetLines?: string[];
    };
  };
  packageInfo?: {
    count?: number;
    weight?: string;
    dimensions?: string;
    packagingDescription?: string;
    sequenceNumber?: string;
  };
  serviceInfo?: {
    type?: string;
    description?: string;
  };
  dateInfo?: {
    shipDate?: string;
    estimatedDelivery?: string;
    estimatedDeliveryTime?: string;
    estimatedDeliveryWindowStart?: string;
    estimatedDeliveryWindowEnd?: string;
    commitDate?: string;
    actualDelivery?: string;
    pickupDate?: string;
  };
  signedBy?: string;
  deliveryLocation?: string;
}

/**
 * FedEx 배송 상세 조회 Hook (SWR 캐싱)
 * - 5분간 캐시 유지
 * - 같은 송장번호 재조회 시 캐시 사용
 */
export function useFedExTrackingDetail(trackingNumber: string | null) {
  const { data, error, isLoading, mutate } = useSWR<FedExTrackingDetail>(
    trackingNumber ? `/api/fedex/track/${trackingNumber}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5 * 60 * 1000, // 5분간 중복 요청 방지
      errorRetryCount: 2,
    }
  );

  return {
    detail: data || null,
    error: error ? "조회 실패" : data?.error,
    isLoading,
    mutate,
  };
}
