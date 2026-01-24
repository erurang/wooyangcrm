import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * 재고 예측 및 자동 발주 권장 API
 *
 * GET /api/inventory/auto-order-suggestions
 *
 * 계산 로직:
 * - 일평균 소모량 = 최근 90일 출고량 / 90
 * - 소진 예상일 = 현재재고 / 일평균소모량
 * - 권장 발주량 = (목표 재고일수 * 일평균소모량) - 현재재고
 */

interface AutoOrderSuggestion {
  productId: string;
  productCode: string;
  productName: string;
  productType: string;
  currentStock: number;
  minStock: number | null;
  unit: string;
  avgDailyConsumption: number;
  daysUntilStockout: number | null;
  suggestedOrderQuantity: number;
  urgency: "critical" | "high" | "medium" | "low";
  last90DaysOutbound: number;
  lastOrderDate: string | null;
  preferredSupplier: {
    id: string;
    name: string;
  } | null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productType = searchParams.get("type"); // 'raw_material', 'purchased', 'finished'
    const urgencyFilter = searchParams.get("urgency"); // 'critical', 'high', 'medium', 'low'
    const targetStockDays = parseInt(searchParams.get("targetDays") || "30");

    // 1. 활성화된 제품 목록 조회
    let productsQuery = supabase
      .from("products")
      .select("id, internal_code, internal_name, type, current_stock, min_stock_alert, unit")
      .eq("is_active", true);

    if (productType) {
      productsQuery = productsQuery.eq("type", productType);
    }

    const { data: products, error: productsError } = await productsQuery;

    if (productsError) {
      console.error("Products query error:", productsError);
      return NextResponse.json({ error: "제품 조회 실패" }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ suggestions: [], summary: getEmptySummary() });
    }

    // 2. 최근 90일 출고량 조회 (product_transactions 테이블)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split("T")[0];

    const { data: transactions, error: transactionsError } = await supabase
      .from("product_transactions")
      .select("product_id, quantity, transaction_date")
      .eq("transaction_type", "outbound")
      .gte("transaction_date", ninetyDaysAgoStr);

    if (transactionsError) {
      console.error("Transactions query error:", transactionsError);
    }

    // 제품별 출고량 합계
    const outboundByProduct: Record<string, number> = {};
    (transactions || []).forEach((t) => {
      if (!outboundByProduct[t.product_id]) {
        outboundByProduct[t.product_id] = 0;
      }
      outboundByProduct[t.product_id] += Math.abs(Number(t.quantity));
    });

    // 3. 최근 발주일 조회 (inbound 트랜잭션)
    const { data: lastInbounds } = await supabase
      .from("product_transactions")
      .select("product_id, transaction_date")
      .eq("transaction_type", "inbound")
      .order("transaction_date", { ascending: false });

    const lastOrderByProduct: Record<string, string> = {};
    (lastInbounds || []).forEach((t) => {
      if (!lastOrderByProduct[t.product_id]) {
        lastOrderByProduct[t.product_id] = t.transaction_date;
      }
    });

    // 4. 발주 권장 분석
    const suggestions: AutoOrderSuggestion[] = [];

    for (const product of products) {
      const currentStock = Number(product.current_stock) || 0;
      const minStock = product.min_stock_alert ? Number(product.min_stock_alert) : null;
      const last90DaysOutbound = outboundByProduct[product.id] || 0;

      // 일평균 소모량 계산
      const avgDailyConsumption = last90DaysOutbound / 90;

      // 소진 예상일 계산
      let daysUntilStockout: number | null = null;
      if (avgDailyConsumption > 0) {
        daysUntilStockout = Math.round(currentStock / avgDailyConsumption);
      }

      // 권장 발주량 계산
      const targetStock = targetStockDays * avgDailyConsumption;
      let suggestedOrderQuantity = Math.max(0, Math.ceil(targetStock - currentStock));

      // 최소 재고 기준으로 보정
      if (minStock !== null && currentStock < minStock) {
        const minBasedSuggestion = Math.ceil((minStock * 1.5) - currentStock);
        suggestedOrderQuantity = Math.max(suggestedOrderQuantity, minBasedSuggestion);
      }

      // 긴급도 판단
      let urgency: AutoOrderSuggestion["urgency"] = "low";

      if (currentStock === 0) {
        urgency = "critical";
      } else if (minStock !== null && currentStock < minStock) {
        urgency = "critical";
      } else if (daysUntilStockout !== null && daysUntilStockout <= 7) {
        urgency = "critical";
      } else if (daysUntilStockout !== null && daysUntilStockout <= 14) {
        urgency = "high";
      } else if (daysUntilStockout !== null && daysUntilStockout <= 30) {
        urgency = "medium";
      } else if (minStock !== null && currentStock < minStock * 1.5) {
        urgency = "medium";
      }

      // 발주가 필요한 항목만 포함 (medium 이상 또는 suggestedOrderQuantity > 0)
      if (urgency !== "low" || suggestedOrderQuantity > 0) {
        suggestions.push({
          productId: product.id,
          productCode: product.internal_code,
          productName: product.internal_name,
          productType: product.type,
          currentStock,
          minStock,
          unit: product.unit || "개",
          avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100,
          daysUntilStockout,
          suggestedOrderQuantity,
          urgency,
          last90DaysOutbound,
          lastOrderDate: lastOrderByProduct[product.id] || null,
          preferredSupplier: null, // TODO: 거래처 연동
        });
      }
    }

    // 긴급도 필터링
    let filteredSuggestions = suggestions;
    if (urgencyFilter) {
      filteredSuggestions = suggestions.filter((s) => s.urgency === urgencyFilter);
    }

    // 긴급도 순으로 정렬 (critical > high > medium > low)
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    filteredSuggestions.sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      // 같은 긴급도면 소진 예상일 기준 정렬
      if (a.daysUntilStockout === null) return 1;
      if (b.daysUntilStockout === null) return -1;
      return a.daysUntilStockout - b.daysUntilStockout;
    });

    // 요약 통계
    const summary = {
      total: suggestions.length,
      critical: suggestions.filter((s) => s.urgency === "critical").length,
      high: suggestions.filter((s) => s.urgency === "high").length,
      medium: suggestions.filter((s) => s.urgency === "medium").length,
      low: suggestions.filter((s) => s.urgency === "low").length,
      totalSuggestedItems: suggestions.reduce((sum, s) => sum + s.suggestedOrderQuantity, 0),
    };

    return NextResponse.json({
      suggestions: filteredSuggestions,
      summary,
      calculationParams: {
        targetStockDays,
        analysisRange: "90일",
        calculatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Auto order suggestions error:", error);
    return NextResponse.json(
      { error: "발주 권장 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

function getEmptySummary() {
  return {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    totalSuggestedItems: 0,
  };
}
