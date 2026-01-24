import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchExchangeRatesFromKoreaExim,
  getLastBusinessDay,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/koreaExim";

/**
 * 환율 조회 API
 * GET /api/exchange-rate?currency=USD&date=2025-01-24
 *
 * - currency: 통화 코드 (USD, EUR, CNY) - 없으면 전체
 * - date: 조회 날짜 (YYYY-MM-DD) - 없으면 오늘
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const currency = searchParams.get("currency") as SupportedCurrency | null;
    const dateStr = searchParams.get("date");
    const refresh = searchParams.get("refresh") === "true";

    // 날짜 파싱
    let targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate = getLastBusinessDay(targetDate);
    const baseDateStr = targetDate.toISOString().split("T")[0];

    // 1. DB에서 캐시된 환율 조회 (테이블 없어도 에러 무시)
    let cachedRates: any[] | null = null;
    try {
      let query = supabase
        .from("exchange_rates")
        .select("*")
        .eq("base_date", baseDateStr);

      if (currency) {
        query = query.eq("currency", currency);
      }

      const { data, error } = await query;
      if (!error) {
        cachedRates = data;
      }
    } catch (e) {
      // 테이블 없으면 무시하고 API 직접 호출
      console.warn("Cache lookup skipped:", e);
    }

    // 2. 캐시가 있고 refresh가 아니면 캐시 반환
    if (cachedRates && cachedRates.length > 0 && !refresh) {
      if (currency) {
        const rate = cachedRates[0];
        return NextResponse.json({
          currency: rate.currency,
          rate: rate.rate,
          ttb: rate.ttb,
          tts: rate.tts,
          baseDate: rate.base_date,
          source: rate.source,
          cached: true,
        });
      }

      return NextResponse.json({
        rates: cachedRates.map((r) => ({
          currency: r.currency,
          rate: r.rate,
          ttb: r.ttb,
          tts: r.tts,
          baseDate: r.base_date,
          source: r.source,
        })),
        cached: true,
      });
    }

    // 3. 한국수출입은행 API에서 환율 조회
    console.log("Fetching from Korea EXIM API for date:", baseDateStr);
    const rates = await fetchExchangeRatesFromKoreaExim(targetDate);
    console.log("Fetched rates:", rates.length, "items");

    if (rates.length === 0) {
      // 이전 영업일 환율 조회 시도
      const prevDate = new Date(targetDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevBusinessDay = getLastBusinessDay(prevDate);
      console.log("Trying previous business day:", prevBusinessDay.toISOString().split("T")[0]);
      const prevRates = await fetchExchangeRatesFromKoreaExim(prevBusinessDay);

      if (prevRates.length === 0) {
        // API 키가 없거나 데이터 없음
        const apiKey = process.env.KOREA_EXIM_API_KEY;
        if (!apiKey) {
          return NextResponse.json(
            { error: "KOREA_EXIM_API_KEY가 설정되지 않았습니다.", rates: [] },
            { status: 200 }
          );
        }
        return NextResponse.json(
          { error: "환율 데이터를 조회할 수 없습니다.", rates: [] },
          { status: 200 }
        );
      }

      // 이전 영업일 환율 저장 및 반환
      await saveRatesToDB(prevRates);
      return formatResponse(prevRates, currency, false);
    }

    // 4. DB에 환율 저장 (실패해도 무시)
    await saveRatesToDB(rates);

    // 5. 응답 반환
    return formatResponse(rates, currency, false);
  } catch (error) {
    console.error("Error in GET /api/exchange-rate:", error);
    return NextResponse.json(
      { error: "환율 조회 중 오류가 발생했습니다.", details: String(error), rates: [] },
      { status: 200 }
    );
  }
}

// 환율 DB 저장 (실패해도 무시)
async function saveRatesToDB(
  rates: Array<{
    currency: string;
    rate: number;
    ttb: number;
    tts: number;
    baseDate: string;
  }>
) {
  try {
    for (const rate of rates) {
      await supabase.from("exchange_rates").upsert(
        {
          currency: rate.currency,
          rate: rate.rate,
          ttb: rate.ttb,
          tts: rate.tts,
          base_date: rate.baseDate,
          source: "한국수출입은행",
        },
        {
          onConflict: "currency,base_date",
        }
      );
    }
  } catch (e) {
    // 테이블 없으면 무시
    console.warn("Failed to cache rates:", e);
  }
}

// 응답 포맷팅
function formatResponse(
  rates: Array<{
    currency: string;
    rate: number;
    ttb: number;
    tts: number;
    baseDate: string;
  }>,
  currency: string | null,
  cached: boolean
) {
  if (currency) {
    const rate = rates.find((r) => r.currency === currency);
    if (!rate) {
      return NextResponse.json(
        { error: `${currency} 환율을 찾을 수 없습니다.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      currency: rate.currency,
      rate: rate.rate,
      ttb: rate.ttb,
      tts: rate.tts,
      baseDate: rate.baseDate,
      source: "한국수출입은행",
      cached,
    });
  }

  return NextResponse.json({
    rates: rates.map((r) => ({
      currency: r.currency,
      rate: r.rate,
      ttb: r.ttb,
      tts: r.tts,
      baseDate: r.baseDate,
      source: "한국수출입은행",
    })),
    cached,
  });
}
