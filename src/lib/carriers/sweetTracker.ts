// 스마트택배 API (국내 택배 추적)
// https://tracking.sweettracker.co.kr

import type { TrackingResult, CarrierCode, TrackingEvent } from "./index";
import { CARRIERS, mapSweetTrackerLevel, getStatusText } from "./index";

interface SweetTrackerResponse {
  status: boolean;
  msg: string;
  result?: {
    complete: boolean;
    level: number;
    itemName?: string;
    invoiceNo: string;
    trackingDetails: Array<{
      timeString: string;
      where: string;
      kind: string;
      level: number;
    }>;
  };
}

/**
 * 스마트택배 API로 배송 조회
 * 지원 택배사: 로젠(08), 경동(23) 등
 */
export async function trackWithSweetTracker(
  carrier: "logen" | "kyungdong",
  trackingNumber: string
): Promise<TrackingResult> {
  const apiKey = process.env.SWEET_TRACKER_API_KEY;

  if (!apiKey) {
    console.warn("SWEET_TRACKER_API_KEY not configured");
    return {
      success: false,
      trackingNumber,
      carrier,
      carrierName: CARRIERS[carrier].name,
      status: "unknown",
      statusText: "API 키 미설정",
      timeline: [],
      error: "스마트택배 API 키가 설정되지 않았습니다.",
    };
  }

  const carrierCode = CARRIERS[carrier].code;
  const url = `https://info.sweettracker.co.kr/api/v1/trackingInfo?t_key=${apiKey}&t_code=${carrierCode}&t_invoice=${trackingNumber}`;

  try {
    const response = await fetch(url);
    const data: SweetTrackerResponse = await response.json();

    if (!data.status || !data.result) {
      return {
        success: false,
        trackingNumber,
        carrier,
        carrierName: CARRIERS[carrier].name,
        status: "unknown",
        statusText: "조회 실패",
        timeline: [],
        error: data.msg || "송장 정보를 찾을 수 없습니다.",
      };
    }

    const result = data.result;
    const status = mapSweetTrackerLevel(result.level);

    // 타임라인 변환
    const timeline: TrackingEvent[] = result.trackingDetails.map((detail) => {
      const [date, time] = detail.timeString.split(" ");
      return {
        date,
        time: time || "",
        status: mapSweetTrackerLevel(detail.level) as string,
        location: detail.where,
        description: detail.kind,
      };
    });

    // 최신순으로 정렬 (최신이 먼저)
    timeline.reverse();

    return {
      success: true,
      trackingNumber,
      carrier,
      carrierName: CARRIERS[carrier].name,
      status,
      statusText: getStatusText(status),
      timeline,
    };
  } catch (error) {
    console.error("SweetTracker API error:", error);
    return {
      success: false,
      trackingNumber,
      carrier,
      carrierName: CARRIERS[carrier].name,
      status: "unknown",
      statusText: "조회 오류",
      timeline: [],
      error: "배송 조회 중 오류가 발생했습니다.",
    };
  }
}
