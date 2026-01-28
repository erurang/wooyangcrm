import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * 단가 이력 조회 API
 * GET /api/products/price-history?product_id=xxx&company_id=xxx&price_type=purchase&spec=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product_id");
    const companyId = searchParams.get("company_id");
    const priceType = searchParams.get("price_type"); // purchase | sales
    const spec = searchParams.get("spec");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    let query = supabase
      .from("product_price_history")
      .select(`
        id,
        product_id,
        company_id,
        alias_id,
        price_type,
        unit_price,
        previous_price,
        spec,
        document_id,
        effective_date,
        notes,
        created_at,
        product:products(id, internal_name, internal_code),
        company:companies(id, name)
      `)
      .order("effective_date", { ascending: false })
      .limit(limit);

    if (productId) {
      query = query.eq("product_id", productId);
    }

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    if (priceType) {
      query = query.eq("price_type", priceType);
    }

    if (spec) {
      query = query.eq("spec", spec);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[PriceHistory] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // price_change, price_change_percent 계산 추가
    const historyWithChanges = (data || []).map((item: { unit_price: number; previous_price: number | null }) => ({
      ...item,
      price_change: item.unit_price - (item.previous_price ?? item.unit_price),
      price_change_percent:
        item.previous_price && item.previous_price > 0
          ? Math.round(((item.unit_price - item.previous_price) / item.previous_price) * 100 * 100) / 100
          : 0,
    }));

    // 통계 정보 계산
    let stats = null;
    if (historyWithChanges.length > 0) {
      const prices = historyWithChanges.map((d: { unit_price: number }) => d.unit_price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      const latestPrice = historyWithChanges[0]?.unit_price || 0;
      const previousPrice = historyWithChanges[1]?.unit_price || latestPrice;

      stats = {
        count: historyWithChanges.length,
        minPrice,
        maxPrice,
        avgPrice: Math.round(avgPrice),
        latestPrice,
        previousPrice,
        priceChange: latestPrice - previousPrice,
        priceChangePercent:
          previousPrice > 0
            ? Math.round(((latestPrice - previousPrice) / previousPrice) * 100 * 100) / 100
            : 0,
      };
    }

    return NextResponse.json({
      history: historyWithChanges,
      stats,
    });
  } catch (error) {
    console.error("[PriceHistory] Error:", error);
    return NextResponse.json(
      { error: "단가 이력 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 단가 이력 수동 등록 API
 * POST /api/products/price-history
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      product_id,
      company_id,
      alias_id,
      price_type,
      unit_price,
      previous_price,
      spec,
      document_id,
      effective_date,
      notes,
    } = body;

    if (!product_id || !price_type || unit_price === undefined) {
      return NextResponse.json(
        { error: "product_id, price_type, unit_price는 필수입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("product_price_history")
      .insert([
        {
          product_id,
          company_id: company_id || null,
          alias_id: alias_id || null,
          price_type,
          unit_price,
          previous_price: previous_price || null,
          spec: spec || null,
          document_id: document_id || null,
          effective_date: effective_date || new Date().toISOString().split("T")[0],
          notes: notes || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[PriceHistory] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "단가 이력이 등록되었습니다.",
      priceHistory: data,
    }, { status: 201 });
  } catch (error) {
    console.error("[PriceHistory] Error:", error);
    return NextResponse.json(
      { error: "단가 이력 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
