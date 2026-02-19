import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/products/stocks - 재고 현황 조회 (페이지네이션 지원)
 * Query params:
 * - search: 제품명/코드/규격 검색
 * - type: 제품 유형 (finished, raw_material, purchased)
 * - lowStock: true면 재고부족 제품만
 * - sortBy: 정렬 기준 (name, stock, code)
 * - sortOrder: asc | desc
 * - page: 페이지 번호 (1부터)
 * - limit: 페이지당 개수 (기본 50)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const typeFilter = searchParams.get("type") || "";
  const lowStock = searchParams.get("lowStock") === "true";
  const sortBy = searchParams.get("sortBy") || "internal_name";
  const sortOrder = searchParams.get("sortOrder") || "asc";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  try {
    // 1. 제품 목록 조회 (페이지네이션)
    let query = supabase
      .from("products")
      .select(
        `id, internal_code, internal_name, spec, unit, current_stock, min_stock_alert, category, type, is_active`,
        { count: "exact" }
      )
      .eq("is_active", true);

    // 검색어 필터
    if (search) {
      query = query.or(
        `internal_name.ilike.%${search}%,internal_code.ilike.%${search}%,spec.ilike.%${search}%`
      );
    }

    // 유형 필터
    if (typeFilter) {
      query = query.eq("type", typeFilter);
    }

    // 재고부족 필터
    if (lowStock) {
      query = query.gt("min_stock_alert", 0).lt("current_stock", 0);
    }

    // 정렬
    const ascending = sortOrder === "asc";
    if (sortBy === "stock") {
      query = query.order("current_stock", { ascending });
    } else if (sortBy === "code") {
      query = query.order("internal_code", { ascending });
    } else {
      query = query.order("internal_name", { ascending });
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: products, error, count } = await query;

    if (error) {
      console.error("재고 조회 오류:", error);
      throw error;
    }

    // 2. 제품별 최신 매입가 조회
    const productIds = products?.map((p) => p.id) || [];

    const priceMap = new Map<
      string,
      { price: number; date: string; company: string | null }
    >();

    if (productIds.length > 0) {
      const { data: priceHistory, error: priceError } = await supabase
        .from("product_price_history")
        .select(
          `product_id, unit_price, effective_date, companies (name)`
        )
        .in("product_id", productIds)
        .eq("price_type", "purchase")
        .order("effective_date", { ascending: false });

      if (!priceError && priceHistory) {
        priceHistory.forEach((ph: any) => {
          if (!priceMap.has(ph.product_id)) {
            priceMap.set(ph.product_id, {
              price: ph.unit_price,
              date: ph.effective_date,
              company: ph.companies?.name || null,
            });
          }
        });
      }
    }

    // 3. 제품에 매입가 정보 병합
    const productsWithPrice = (products || []).map((p) => {
      const priceInfo = priceMap.get(p.id);
      return {
        ...p,
        latest_purchase_price: priceInfo?.price || null,
        latest_purchase_date: priceInfo?.date || null,
        latest_purchase_company: priceInfo?.company || null,
      };
    });

    // 4. 전체 통계 (별도 쿼리 - 필터 무관)
    const { count: totalCount } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    const { count: lowStockCount } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .gt("min_stock_alert", 0)
      .not("current_stock", "gte", supabase);

    const { count: outOfStockCount } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .lte("current_stock", 0);

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      products: productsWithPrice,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
      },
      stats: {
        totalProducts: totalCount || 0,
        lowStockCount: 0,
        outOfStockCount: outOfStockCount || 0,
        totalValue: 0,
      },
    });
  } catch (error) {
    console.error("재고 현황 조회 오류:", error);
    return NextResponse.json(
      { error: "재고 현황을 불러오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}
