import { NextRequest, NextResponse } from "next/server";
import { trackWithFedEx } from "@/lib/carriers/fedex";

/**
 * FedEx 단일 송장 상세 조회 (타임라인 포함)
 * GET /api/fedex/track/[trackingNumber]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;

    if (!trackingNumber) {
      return NextResponse.json(
        { error: "송장번호가 필요합니다." },
        { status: 400 }
      );
    }

    const result = await trackWithFedEx(trackingNumber);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/fedex/track/[trackingNumber]:", error);
    return NextResponse.json(
      { error: "배송 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
