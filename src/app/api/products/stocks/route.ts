import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface ProductWithPrice {
  id: string;
  internal_code: string | null;
  internal_name: string;
  spec: string | null;
  unit: string | null;
  current_stock: number;
  min_stock_alert: number | null;
  category: string | null;
  type: string;
  is_active: boolean;
  latest_purchase_price: number | null;
  latest_purchase_date: string | null;
  latest_purchase_company: string | null;
}

/**
 * GET /api/products/stocks - 재고 현황 조회
 * Query params:
 * - search: 제품명/코드 검색
 * - lowStock: true면 재고부족 제품만
 * - sortBy: 정렬 기준 (name, stock, code)
 * - sortOrder: asc | desc
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const lowStock = searchParams.get("lowStock") === "true";
  const sortBy = searchParams.get("sortBy") || "internal_name";
  const sortOrder = searchParams.get("sortOrder") || "asc";

  try {
    // 1. 제품 목록 조회
    let query = supabase
      .from("products")
      .select(`
        id,
        internal_code,
        internal_name,
        spec,
        unit,
        current_stock,
        min_stock_alert,
        category,
        type,
        is_active
      `)
      .eq("is_active", true);

    // 검색어 필터
    if (search) {
      query = query.or(
        `internal_name.ilike.%${search}%,internal_code.ilike.%${search}%`
      );
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

    const { data: products, error } = await query;

    if (error) {
      console.error("재고 조회 오류:", error);
      throw error;
    }

    // 2. 제품별 최신 매입가 조회
    const productIds = products?.map(p => p.id) || [];

    let priceMap = new Map<string, { price: number; date: string; company: string | null }>();

    if (productIds.length > 0) {
      // 매입 단가 이력에서 제품별 최신 가격 조회
      const { data: priceHistory, error: priceError } = await supabase
        .from("product_price_history")
        .select(`
          product_id,
          unit_price,
          effective_date,
          companies (name)
        `)
        .in("product_id", productIds)
        .eq("price_type", "purchase")
        .order("effective_date", { ascending: false });

      if (!priceError && priceHistory) {
        // 제품별 가장 최신 매입가만 저장
        priceHistory.forEach((ph: any) => {
          if (!priceMap.has(ph.product_id)) {
            priceMap.set(ph.product_id, {
              price: ph.unit_price,
              date: ph.effective_date,
              company: ph.companies?.name || null
            });
          }
        });
      }
    }

    // 3. 제품에 매입가 정보 병합
    const productsWithPrice: ProductWithPrice[] = (products || []).map(p => {
      const priceInfo = priceMap.get(p.id);
      return {
        ...p,
        latest_purchase_price: priceInfo?.price || null,
        latest_purchase_date: priceInfo?.date || null,
        latest_purchase_company: priceInfo?.company || null
      };
    });

    // 재고부족 필터
    let filteredProducts = productsWithPrice;
    if (lowStock) {
      filteredProducts = filteredProducts.filter(
        (p) => p.min_stock_alert && p.current_stock < p.min_stock_alert
      );
    }

    // 통계 계산 (매입가 기준 재고가치)
    const stats = {
      totalProducts: filteredProducts.length,
      lowStockCount: filteredProducts.filter(
        (p) => p.min_stock_alert && p.current_stock < p.min_stock_alert
      ).length,
      outOfStockCount: filteredProducts.filter(
        (p) => p.current_stock <= 0
      ).length,
      totalValue: filteredProducts.reduce(
        (sum, p) => sum + (p.current_stock || 0) * (p.latest_purchase_price || 0),
        0
      ),
    };

    return NextResponse.json({
      products: filteredProducts,
      stats,
    });
  } catch (error) {
    console.error("재고 현황 조회 오류:", error);
    return NextResponse.json(
      { error: "재고 현황을 불러오는 데 실패했습니다." },
      { status: 500 }
    );
  }
}
