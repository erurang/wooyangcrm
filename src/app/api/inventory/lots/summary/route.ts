import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * 제품별 LOT 요약 조회
 * GET /api/inventory/lots/summary?search=xxx&lowStock=true
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const lowStock = searchParams.get("lowStock") === "true";

    // 1. 제품 목록 조회
    let productQuery = supabase
      .from("products")
      .select("id, internal_code, internal_name, unit, type, current_stock, min_stock_alert, is_active")
      .eq("is_active", true)
      .order("internal_name");

    if (search) {
      productQuery = productQuery.or(
        `internal_name.ilike.%${search}%,internal_code.ilike.%${search}%`
      );
    }

    const { data: products, error: productError } = await productQuery;

    if (productError) {
      console.error("Error fetching products:", productError);
      return NextResponse.json(
        { error: "제품 조회 실패", products: [], stats: null },
        { status: 200 }
      );
    }

    // 2. 모든 사용 가능한 LOT 조회
    const { data: allLots, error: lotsError } = await supabase
      .from("inventory_lots")
      .select(`
        id, lot_number, product_id, current_quantity, initial_quantity,
        unit, spec_value, status, source_type, location, received_at,
        unit_cost
      `)
      .in("status", ["available", "reserved"])
      .order("created_at", { ascending: false });

    if (lotsError) {
      console.error("Error fetching lots:", lotsError);
    }

    const lots = allLots || [];

    // 3. 제품별로 LOT 그룹핑
    const lotsByProduct: Record<string, typeof lots> = {};
    for (const lot of lots) {
      if (!lotsByProduct[lot.product_id]) {
        lotsByProduct[lot.product_id] = [];
      }
      lotsByProduct[lot.product_id].push(lot);
    }

    // 4. 제품 요약 생성
    let productSummaries = products?.map((product) => {
      const productLots = lotsByProduct[product.id] || [];
      const availableQty = productLots
        .filter((l) => l.status === "available")
        .reduce((sum, l) => sum + (l.current_quantity || 0), 0);

      return {
        id: product.id,
        internal_code: product.internal_code,
        internal_name: product.internal_name,
        unit: product.unit,
        type: product.type || "material",
        current_stock: product.current_stock || 0,
        min_stock_alert: product.min_stock_alert,
        latest_purchase_price: productLots[0]?.unit_cost || null,
        lots: productLots.map((lot) => ({
          ...lot,
          product: {
            id: product.id,
            internal_code: product.internal_code,
            internal_name: product.internal_name,
            unit: product.unit,
          },
        })),
        lot_count: productLots.length,
        available_quantity: availableQty,
      };
    }) || [];

    // 5. 재고 부족 필터
    if (lowStock) {
      productSummaries = productSummaries.filter((p) => {
        if (p.current_stock <= 0) return true;
        if (p.min_stock_alert && p.current_stock < p.min_stock_alert) return true;
        return false;
      });
    }

    // 6. 통계 계산
    const stats = {
      totalProducts: products?.length || 0,
      lowStockCount: (products || []).filter(
        (p) => p.min_stock_alert && (p.current_stock || 0) < p.min_stock_alert
      ).length,
      outOfStockCount: (products || []).filter((p) => (p.current_stock || 0) <= 0).length,
      totalValue: lots.reduce(
        (sum, lot) => sum + (lot.current_quantity || 0) * (lot.unit_cost || 0),
        0
      ),
      totalLots: lots.length,
      availableLots: lots.filter((l) => l.status === "available").length,
    };

    return NextResponse.json({
      products: productSummaries,
      stats,
    });
  } catch (error) {
    console.error("Error in GET /api/inventory/lots/summary:", error);
    return NextResponse.json(
      { error: "서버 오류", products: [], stats: null },
      { status: 500 }
    );
  }
}
