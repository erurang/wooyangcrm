import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface AutoOrderSuggestion {
  productId: string;
  productCode: string;
  productName: string;
  category: string | null;
  unit: string;
  currentStock: number;
  minStock: number;
  avgDailyConsumption: number;
  daysUntilStockout: number;
  suggestedOrderQuantity: number;
  urgency: "high" | "medium" | "low";
  lastOrderDate: string | null;
  preferredSupplier: {
    id: string;
    name: string;
  } | null;
}

/**
 * 자동 발주 권장 API
 * GET /api/inventory/auto-order
 *
 * 재고 부족이 예상되는 제품과 권장 발주량을 계산
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetStockDays = parseInt(searchParams.get("targetDays") || "30");
    const urgencyFilter = searchParams.get("urgency") as "high" | "medium" | "low" | null;

    // 1. min_stock_alert가 설정된 제품 조회
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .not("min_stock_alert", "is", null)
      .eq("is_active", true)
      .order("internal_name");

    if (productsError) throw productsError;

    if (!products || products.length === 0) {
      return NextResponse.json({
        suggestions: [],
        summary: {
          total: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      });
    }

    // 2. 최근 90일 출고 트랜잭션 조회
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split("T")[0];

    const productIds = products.map((p) => p.id);

    const { data: transactions, error: txError } = await supabase
      .from("product_transactions")
      .select("product_id, quantity, transaction_date, reference_type, reference_id")
      .in("product_id", productIds)
      .gte("transaction_date", ninetyDaysAgoStr)
      .lt("quantity", 0) // 출고 (음수 수량)
      .order("transaction_date", { ascending: false });

    if (txError) throw txError;

    // 3. 제품별 일평균 소모량 계산
    const consumptionMap: Record<string, { totalOut: number; days: Set<string> }> = {};
    transactions?.forEach((tx) => {
      if (!consumptionMap[tx.product_id]) {
        consumptionMap[tx.product_id] = { totalOut: 0, days: new Set() };
      }
      consumptionMap[tx.product_id].totalOut += Math.abs(tx.quantity);
      consumptionMap[tx.product_id].days.add(tx.transaction_date);
    });

    // 4. 최근 입고(발주) 정보 조회 - 선호 거래처 찾기
    const { data: recentInbound } = await supabase
      .from("product_transactions")
      .select(`
        product_id,
        transaction_date,
        reference_type,
        reference_id
      `)
      .in("product_id", productIds)
      .gt("quantity", 0) // 입고 (양수 수량)
      .eq("reference_type", "inbound")
      .order("transaction_date", { ascending: false });

    // reference_id에서 회사 정보 가져오기 (inventory_tasks -> company)
    const inboundReferenceIds = [...new Set(recentInbound?.map((r) => r.reference_id).filter(Boolean))];
    let companyMap: Record<string, { id: string; name: string }> = {};

    if (inboundReferenceIds.length > 0) {
      const { data: tasks } = await supabase
        .from("inventory_tasks")
        .select(`
          id,
          company:companies!inventory_tasks_company_id_fkey (id, name)
        `)
        .in("id", inboundReferenceIds);

      tasks?.forEach((task: any) => {
        if (task.company) {
          companyMap[task.id] = task.company;
        }
      });
    }

    // 5. 발주 권장 목록 생성
    const suggestions: AutoOrderSuggestion[] = [];

    for (const product of products) {
      const consumption = consumptionMap[product.id];
      const totalOut = consumption?.totalOut || 0;

      // 일평균 소모량 = 90일간 총 출고량 / 90
      const avgDailyConsumption = totalOut / 90;

      // 소진 예상일 = 현재재고 / 일평균소모량
      const daysUntilStockout =
        avgDailyConsumption > 0
          ? Math.round(product.current_stock / avgDailyConsumption)
          : product.current_stock > 0
            ? 999
            : 0;

      // 권장 발주량 = (목표재고일수 * 일평균소모량) - 현재재고
      const targetStock = targetStockDays * avgDailyConsumption;
      const suggestedOrderQuantity = Math.max(
        0,
        Math.ceil(targetStock - product.current_stock)
      );

      // 긴급도 계산
      let urgency: "high" | "medium" | "low";
      if (product.current_stock <= 0 || daysUntilStockout <= 7) {
        urgency = "high";
      } else if (
        product.current_stock < product.min_stock_alert ||
        daysUntilStockout <= 14
      ) {
        urgency = "medium";
      } else if (daysUntilStockout <= 30) {
        urgency = "low";
      } else {
        // 30일 이상 여유 있으면 권장 목록에서 제외
        continue;
      }

      // 필터 적용
      if (urgencyFilter && urgency !== urgencyFilter) continue;

      // 최근 입고 정보에서 선호 거래처 찾기
      const recentProductInbound = recentInbound?.find(
        (r) => r.product_id === product.id
      );
      const preferredSupplier = recentProductInbound?.reference_id
        ? companyMap[recentProductInbound.reference_id] || null
        : null;

      suggestions.push({
        productId: product.id,
        productCode: product.internal_code,
        productName: product.internal_name,
        category: product.category,
        unit: product.unit || "개",
        currentStock: product.current_stock,
        minStock: product.min_stock_alert,
        avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100,
        daysUntilStockout,
        suggestedOrderQuantity,
        urgency,
        lastOrderDate: recentProductInbound?.transaction_date || null,
        preferredSupplier,
      });
    }

    // 긴급도 순으로 정렬
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    // 요약 통계
    const summary = {
      total: suggestions.length,
      high: suggestions.filter((s) => s.urgency === "high").length,
      medium: suggestions.filter((s) => s.urgency === "medium").length,
      low: suggestions.filter((s) => s.urgency === "low").length,
    };

    return NextResponse.json({
      suggestions,
      summary,
      settings: {
        targetStockDays,
        analysisRange: "90일",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/inventory/auto-order:", error);
    return NextResponse.json(
      { error: "자동 발주 권장 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
