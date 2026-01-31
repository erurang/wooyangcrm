import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * 거래 상태 자동 업데이트 Cron Job
 *
 * 날짜 기반 자동 상태 전환:
 * - 생산완료예정일 도래 + 상태가 "ordered" → "production_complete"
 * - 출고일 이후 + 상태가 "shipped" → "in_transit"
 *
 * 입고일은 실제 시점이 달라질 수 있어 자동 전환하지 않음
 */
export async function GET(req: NextRequest) {
  // Cron secret 검증 (선택적 보안)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const results = {
    production_complete: 0,
    in_transit: 0,
    errors: [] as string[],
  };

  try {
    // 1. 생산완료예정일 도래 → production_complete
    const { data: toProductionComplete, error: err1 } = await supabase
      .from("consultations")
      .update({ trade_status: "production_complete" })
      .eq("trade_status", "ordered")
      .lte("expected_completion_date", today)
      .not("expected_completion_date", "is", null)
      .select("id");

    if (err1) {
      results.errors.push(`production_complete 업데이트 실패: ${err1.message}`);
    } else {
      results.production_complete = toProductionComplete?.length || 0;
    }

    // 2. 출고일 이후 + shipped → in_transit
    const { data: toInTransit, error: err2 } = await supabase
      .from("consultations")
      .update({ trade_status: "in_transit" })
      .eq("trade_status", "shipped")
      .lt("pickup_date", today)
      .not("pickup_date", "is", null)
      .select("id");

    if (err2) {
      results.errors.push(`in_transit 업데이트 실패: ${err2.message}`);
    } else {
      results.in_transit = toInTransit?.length || 0;
    }

    console.log(`[Cron] 거래 상태 업데이트 완료:`, results);

    return NextResponse.json({
      success: true,
      message: "거래 상태 자동 업데이트 완료",
      date: today,
      updated: {
        production_complete: results.production_complete,
        in_transit: results.in_transit,
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error("[Cron] 거래 상태 업데이트 오류:", error);
    return NextResponse.json(
      { error: "거래 상태 업데이트 중 오류 발생" },
      { status: 500 }
    );
  }
}
