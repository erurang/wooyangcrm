import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { CarrierCode, TrackingResult } from "@/lib/carriers";
import { CARRIERS, getStatusText } from "@/lib/carriers";
import { trackWithSweetTracker } from "@/lib/carriers/sweetTracker";
import { trackWithFedEx } from "@/lib/carriers/fedex";

/**
 * 배송 추적 API
 * GET /api/shipping/track?carrier=logen&trackingNumber=123456789
 * POST /api/shipping/track - 수동 추적 등록
 */

// GET: 배송 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const carrier = searchParams.get("carrier") as CarrierCode | null;
    const trackingNumber = searchParams.get("trackingNumber");

    if (!carrier || !trackingNumber) {
      return NextResponse.json(
        { error: "carrier와 trackingNumber가 필요합니다." },
        { status: 400 }
      );
    }

    // 유효한 택배사인지 확인
    if (!CARRIERS[carrier]) {
      return NextResponse.json(
        { error: "지원하지 않는 택배사입니다." },
        { status: 400 }
      );
    }

    let result: TrackingResult;

    // 택배사별 조회
    switch (carrier) {
      case "logen":
      case "kyungdong":
        result = await trackWithSweetTracker(carrier, trackingNumber);
        break;
      case "fedex":
        result = await trackWithFedEx(trackingNumber);
        break;
      case "sne":
        // SNE는 수동 입력만 지원 - DB에서 조회
        const { data: sneData } = await supabase
          .from("shipping_tracking")
          .select("*")
          .eq("carrier", "sne")
          .eq("tracking_number", trackingNumber)
          .single();

        if (sneData) {
          result = {
            success: true,
            trackingNumber,
            carrier: "sne",
            carrierName: "SNE",
            status: sneData.status || "in_transit",
            statusText: getStatusText(sneData.status || "in_transit"),
            eta: sneData.eta,
            timeline: sneData.timeline || [],
          };
        } else {
          result = {
            success: false,
            trackingNumber,
            carrier: "sne",
            carrierName: "SNE",
            status: "unknown",
            statusText: "조회 실패",
            timeline: [],
            error: "등록된 배송 정보가 없습니다. 수동으로 등록해주세요.",
          };
        }
        break;
      default:
        return NextResponse.json(
          { error: "지원하지 않는 택배사입니다." },
          { status: 400 }
        );
    }

    // 조회 결과를 DB에 캐시 (성공 시)
    if (result.success) {
      await supabase.from("shipping_tracking").upsert(
        {
          carrier,
          tracking_number: trackingNumber,
          status: result.status,
          eta: result.eta || null,
          timeline: result.timeline,
          last_checked: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "carrier,tracking_number",
        }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/shipping/track:", error);
    return NextResponse.json(
      { error: "배송 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 수동 추적 등록 (SNE 등)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      orderType,
      carrier,
      trackingNumber,
      origin,
      destination,
      eta,
      status,
      timeline,
    } = body;

    if (!carrier || !trackingNumber) {
      return NextResponse.json(
        { error: "carrier와 trackingNumber가 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("shipping_tracking")
      .upsert(
        {
          order_id: orderId || null,
          order_type: orderType || null,
          carrier,
          tracking_number: trackingNumber,
          origin: origin || null,
          destination: destination || null,
          status: status || "pending",
          eta: eta || null,
          timeline: timeline || [],
          last_checked: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "carrier,tracking_number",
        }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "배송 정보가 등록되었습니다.",
      tracking: data,
    });
  } catch (error) {
    console.error("Error in POST /api/shipping/track:", error);
    return NextResponse.json(
      { error: "배송 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
