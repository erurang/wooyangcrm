import { NextRequest, NextResponse } from "next/server";
import {
  getFedExShipmentsByAccount,
  trackMultipleFedEx,
} from "@/lib/carriers/fedex";

/**
 * FedEx 배송 리스트 조회 API
 * GET /api/fedex/shipments?days=30
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    const result = await getFedExShipmentsByAccount(days);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, shipments: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({
      shipments: result.shipments,
      count: result.shipments.length,
    });
  } catch (error) {
    console.error("Error in GET /api/fedex/shipments:", error);
    return NextResponse.json(
      { error: "배송 목록 조회 중 오류가 발생했습니다.", shipments: [] },
      { status: 200 }
    );
  }
}

/**
 * 여러 송장번호 조회
 * POST /api/fedex/shipments
 * { trackingNumbers: ["123", "456"] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trackingNumbers } = body;

    if (!trackingNumbers || !Array.isArray(trackingNumbers)) {
      return NextResponse.json(
        { error: "trackingNumbers 배열이 필요합니다." },
        { status: 400 }
      );
    }

    const result = await trackMultipleFedEx(trackingNumbers);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, shipments: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({
      shipments: result.shipments,
      count: result.shipments.length,
    });
  } catch (error) {
    console.error("Error in POST /api/fedex/shipments:", error);
    return NextResponse.json(
      { error: "배송 조회 중 오류가 발생했습니다.", shipments: [] },
      { status: 200 }
    );
  }
}
