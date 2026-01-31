import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// 스마트택배 API 택배사 코드
// https://tracking.sweettracker.co.kr/
export const SWEETTRACKER_CARRIERS = {
  "04": { name: "CJ대한통운", code: "04" },
  "06": { name: "로젠택배", code: "06" },
  "05": { name: "한진택배", code: "05" },
  "08": { name: "롯데택배", code: "08" },
  "01": { name: "우체국택배", code: "01" },
  "23": { name: "경동택배", code: "23" },
  "46": { name: "CU편의점택배", code: "46" },
  "24": { name: "대신택배", code: "24" },
  "22": { name: "대한통운(구)", code: "22" },
  "11": { name: "일양로지스", code: "11" },
} as const;

export type SweetTrackerCarrierCode = keyof typeof SWEETTRACKER_CARRIERS;

interface SweetTrackerResponse {
  status: boolean;
  msg: string;
  result: string;
  spidering?: boolean;
  spiderHtml?: string;
  spiederLink?: string;
  firstDetail?: {
    kind: string;
    level: number;
    telno: string;
    timeString: string;
    where: string;
  };
  lastDetail?: {
    kind: string;
    level: number;
    telno: string;
    timeString: string;
    where: string;
  };
  lastStateDetail?: {
    kind: string;
    level: number;
    telno: string;
    timeString: string;
    where: string;
  };
  completeYN: string;
  invoiceNo: string;
  itemName?: string;
  itemImage?: string;
  receiverName?: string;
  adUrl?: string;
  estimate?: string;
  level: number;
  trackingDetails: Array<{
    kind: string;
    level: number;
    telno: string;
    timeString: string;
    where: string;
  }>;
}

/**
 * GET /api/domestic/track/[trackingNumber]?carrier=04
 * 국내 택배 배송 조회 (스마트택배 API)
 * - 배송완료된 건은 DB 캐시에서 반환
 * - 미완료 건만 API 호출
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;
    const carrierCode = req.nextUrl.searchParams.get("carrier") as SweetTrackerCarrierCode;

    if (!trackingNumber) {
      return NextResponse.json(
        { success: false, error: "송장번호가 필요합니다." },
        { status: 400 }
      );
    }

    if (!carrierCode || !SWEETTRACKER_CARRIERS[carrierCode]) {
      return NextResponse.json(
        { success: false, error: "유효한 택배사 코드가 필요합니다." },
        { status: 400 }
      );
    }

    // 1. 먼저 DB에서 캐시된 결과 확인 (배송완료된 건)
    const { data: existingTracking } = await supabase
      .from("shipping_tracking")
      .select("id, is_completed, cached_result")
      .eq("tracking_number", trackingNumber)
      .eq("carrier", "domestic")
      .single();

    // 배송완료된 건이고 캐시가 있으면 캐시 반환
    if (existingTracking?.is_completed && existingTracking?.cached_result) {
      return NextResponse.json(existingTracking.cached_result);
    }

    const apiKey = process.env.SWEETTRACKER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "스마트택배 API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 2. 스마트택배 API 호출
    const apiUrl = `http://info.sweettracker.co.kr/api/v1/trackingInfo?t_key=${apiKey}&t_code=${carrierCode}&t_invoice=${trackingNumber}`;

    const response = await fetch(apiUrl);
    const data: SweetTrackerResponse = await response.json();

    if (!data.status && data.msg) {
      return NextResponse.json(
        { success: false, error: data.msg },
        { status: 400 }
      );
    }

    // 응답 데이터 정규화
    const normalizedResult = {
      success: true,
      trackingNumber,
      carrier: carrierCode,
      carrierName: SWEETTRACKER_CARRIERS[carrierCode].name,
      status: mapLevel(data.level),
      statusText: getStatusText(data.level),
      isCompleted: data.completeYN === "Y",
      itemName: data.itemName,
      receiverName: data.receiverName,
      estimate: data.estimate,
      timeline: (data.trackingDetails || []).map((detail) => ({
        date: formatDate(detail.timeString),
        time: formatTime(detail.timeString),
        status: mapLevel(detail.level),
        location: detail.where || "",
        description: detail.kind || "",
        telno: detail.telno,
      })),
    };

    // 3. 배송완료된 경우 DB에 캐시 저장
    if (data.completeYN === "Y" && existingTracking?.id) {
      await supabase
        .from("shipping_tracking")
        .update({
          is_completed: true,
          cached_result: normalizedResult,
          completed_at: new Date().toISOString(),
          status: "delivered",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingTracking.id);
    }

    return NextResponse.json(normalizedResult);
  } catch (error) {
    console.error("Domestic tracking error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "배송 조회 실패",
      },
      { status: 500 }
    );
  }
}

// 스마트택배 level을 상태로 변환
function mapLevel(level: number): string {
  // 스마트택배 level: 1=접수, 2=이동중, 3=동네도착, 4=배달출발, 5=배달중, 6=배달완료
  const levelMap: Record<number, string> = {
    1: "pending",
    2: "in_transit",
    3: "in_transit",
    4: "out_for_delivery",
    5: "out_for_delivery",
    6: "delivered",
  };
  return levelMap[level] || "in_transit";
}

// 상태 텍스트
function getStatusText(level: number): string {
  const textMap: Record<number, string> = {
    1: "상품접수",
    2: "상품이동중",
    3: "배송지역도착",
    4: "배달출발",
    5: "배달중",
    6: "배달완료",
  };
  return textMap[level] || "알 수 없음";
}

// 날짜 포맷 (스마트택배: "2025-01-26 14:30:00" 형식)
function formatDate(dateStr: string): string {
  try {
    if (!dateStr) return "";
    const [datePart] = dateStr.split(" ");
    return datePart;
  } catch {
    return dateStr;
  }
}

// 시간 포맷
function formatTime(dateStr: string): string {
  try {
    if (!dateStr) return "";
    const parts = dateStr.split(" ");
    if (parts.length >= 2) {
      const timePart = parts[1];
      const [hours, minutes] = timePart.split(":");
      return `${hours}:${minutes}`;
    }
    return "";
  } catch {
    return "";
  }
}
