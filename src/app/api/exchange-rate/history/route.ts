import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { SupportedCurrency } from "@/lib/koreaExim";

/**
 * 환율 이력 조회 API
 * GET /api/exchange-rate/history?currency=USD&startDate=2025-01-01&endDate=2025-01-24
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const currency = searchParams.get("currency") as SupportedCurrency | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 기본값: 최근 30일
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    let query = supabase
      .from("exchange_rates")
      .select("*")
      .gte("base_date", start.toISOString().split("T")[0])
      .lte("base_date", end.toISOString().split("T")[0])
      .order("base_date", { ascending: true });

    if (currency) {
      query = query.eq("currency", currency);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 통화별로 그룹화
    const grouped: Record<
      string,
      Array<{
        date: string;
        rate: number;
        ttb: number;
        tts: number;
      }>
    > = {};

    data?.forEach((item) => {
      if (!grouped[item.currency]) {
        grouped[item.currency] = [];
      }
      grouped[item.currency].push({
        date: item.base_date,
        rate: item.rate,
        ttb: item.ttb,
        tts: item.tts,
      });
    });

    // 변동률 계산
    const summary: Record<
      string,
      {
        currency: string;
        latestRate: number;
        changeFromStart: number;
        changePercent: number;
        minRate: number;
        maxRate: number;
        avgRate: number;
      }
    > = {};

    Object.entries(grouped).forEach(([curr, history]) => {
      if (history.length === 0) return;

      const rates = history.map((h) => h.rate);
      const firstRate = rates[0];
      const lastRate = rates[rates.length - 1];
      const change = lastRate - firstRate;
      const changePercent =
        firstRate > 0 ? Math.round((change / firstRate) * 10000) / 100 : 0;

      summary[curr] = {
        currency: curr,
        latestRate: lastRate,
        changeFromStart: Math.round(change * 100) / 100,
        changePercent,
        minRate: Math.min(...rates),
        maxRate: Math.max(...rates),
        avgRate: Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100) / 100,
      };
    });

    return NextResponse.json({
      history: grouped,
      summary,
      period: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Error in GET /api/exchange-rate/history:", error);
    return NextResponse.json(
      { error: "환율 이력 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
