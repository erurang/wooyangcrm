import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { ShippingTracking, ShippingTrackingFormData } from "@/types/shipping";

/**
 * 배송 추적 목록 조회
 * GET /api/shipping/tracking?carrier=fedex&status=in_transit
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const carrier = searchParams.get("carrier");
    const status = searchParams.get("status");
    const orderType = searchParams.get("order_type");

    let query = supabase
      .from("shipping_tracking")
      .select("*")
      .order("created_at", { ascending: false });

    if (carrier) {
      query = query.eq("carrier", carrier);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (orderType) {
      query = query.eq("order_type", orderType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching shipping tracking:", error);
      return NextResponse.json(
        { error: "배송 추적 목록 조회 실패", trackings: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({
      trackings: data as ShippingTracking[],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/shipping/tracking:", error);
    return NextResponse.json(
      { error: "서버 오류", trackings: [] },
      { status: 500 }
    );
  }
}

/**
 * 배송 추적 등록
 * POST /api/shipping/tracking
 */
export async function POST(req: NextRequest) {
  try {
    const body: ShippingTrackingFormData = await req.json();

    const { carrier, tracking_number, order_id, order_type, origin, destination, memo } = body;

    if (!carrier || !tracking_number) {
      return NextResponse.json(
        { error: "택배사와 송장번호는 필수입니다." },
        { status: 400 }
      );
    }

    // 중복 체크
    const { data: existing } = await supabase
      .from("shipping_tracking")
      .select("id")
      .eq("carrier", carrier)
      .eq("tracking_number", tracking_number)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "이미 등록된 송장번호입니다." },
        { status: 400 }
      );
    }

    const newTracking = {
      carrier,
      tracking_number,
      order_id: order_id || null,
      order_type: order_type || null,
      origin: origin || null,
      destination: destination || null,
      memo: memo || null,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("shipping_tracking")
      .insert(newTracking)
      .select()
      .single();

    if (error) {
      console.error("Error inserting shipping tracking:", error);
      return NextResponse.json(
        { error: "배송 추적 등록 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, tracking: data });
  } catch (error) {
    console.error("Error in POST /api/shipping/tracking:", error);
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 }
    );
  }
}
