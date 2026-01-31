import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 정산 가능한 통관 건 목록 조회
// 통관 완료된 건 중 아직 정산되지 않은 건들
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id") || "";

    // 통관비용 건 조회 (해외 거래처)
    let query = supabase
      .from("customs_costs")
      .select(
        `
        id,
        company_id,
        consultation_id,
        clearance_date,
        invoice_no,
        air_freight,
        sea_freight,
        express_freight,
        domestic_transport,
        customs_duty,
        port_charges,
        subtotal,
        vat,
        total,
        created_at,
        company:company_id (
          id,
          name,
          is_overseas
        ),
        consultation:consultation_id (
          id,
          oc_number,
          product_name,
          specification,
          total_remittance,
          currency
        )
      `
      )
      .order("clearance_date", { ascending: false });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data: customsCosts, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 해외 거래처만 필터링
    type CustomsCostRow = {
      id: string;
      company_id: string;
      consultation_id?: string;
      clearance_date?: string;
      invoice_no?: string;
      air_freight?: number;
      sea_freight?: number;
      express_freight?: number;
      domestic_transport?: number;
      customs_duty?: number;
      port_charges?: number;
      subtotal?: number;
      vat?: number;
      total?: number;
      created_at: string;
      company?: { id: string; name: string; is_overseas: boolean } | null;
      consultation?: {
        id: string;
        oc_number?: string;
        product_name?: string;
        specification?: string;
        total_remittance?: number;
        currency?: string;
      } | null;
    };

    const typedCosts = (customsCosts || []) as unknown as CustomsCostRow[];
    const overseasCosts = typedCosts.filter(
      (c) => c.company?.is_overseas === true
    );

    // 이미 정산된 건 제외
    const costIds = overseasCosts.map((c) => c.id);
    const { data: settledItems } = await supabase
      .from("import_settlement_items")
      .select("customs_cost_id")
      .in("customs_cost_id", costIds);

    const settledIds = new Set(
      (settledItems || []).map((s) => s.customs_cost_id)
    );

    // 미정산 건만 필터링 및 형식 변환
    const settleableCosts = overseasCosts
      .filter((c) => !settledIds.has(c.id))
      .map((c) => ({
        customs_cost_id: c.id,
        company_id: c.company_id,
        company_name: c.company?.name || "",
        consultation_id: c.consultation_id,
        oc_number: c.consultation?.oc_number,
        product_name: c.consultation?.product_name,
        specification: c.consultation?.specification,
        clearance_date: c.clearance_date,
        invoice_no: c.invoice_no,
        item_amount: c.consultation?.total_remittance || 0,
        item_currency: c.consultation?.currency || "KRW",
        total_customs_cost: c.total || 0,
        created_at: c.created_at,
      }));

    return NextResponse.json({
      customs_costs: settleableCosts,
      total: settleableCosts.length,
    });
  } catch (error) {
    console.error("Error fetching settleable customs costs:", error);
    return NextResponse.json(
      { error: "Failed to fetch settleable customs costs" },
      { status: 500 }
    );
  }
}
