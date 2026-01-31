import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 선송금 미입고 잔액 조회
// 송금은 완료됐지만 아직 입고/정산되지 않은 건들의 합계
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id") || "";

    // 해외 거래처 + 수입 건 + 송금 완료 + 미입고/미정산 건 조회
    let query = supabase
      .from("consultations")
      .select(
        `
        id,
        company_id,
        oc_number,
        product_name,
        total_remittance,
        currency,
        remittance_date,
        trade_status,
        company:company_id (
          id,
          name,
          is_overseas
        )
      `
      )
      .eq("order_type", "import")
      .not("total_remittance", "is", null)
      .gt("total_remittance", 0)
      .not("remittance_date", "is", null);

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data: consultations, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 해외 거래처만 필터링
    type ConsultationRow = {
      id: string;
      company_id: string;
      oc_number?: string;
      product_name?: string;
      total_remittance?: number;
      currency?: string;
      remittance_date?: string;
      trade_status?: string | null;
      company?: { id: string; name: string; is_overseas: boolean } | null;
    };
    const typedConsultations = (consultations || []) as unknown as ConsultationRow[];
    const overseasConsultations = typedConsultations.filter(
      (c) => c.company?.is_overseas === true
    );

    // 미입고/미정산 건 필터링
    const pendingStatuses: (string | null)[] = [null, "ordered", "production_complete", "shipped", "in_transit"];
    const pendingConsultations = overseasConsultations.filter(
      (c) => pendingStatuses.includes(c.trade_status ?? null)
    );

    // 이미 정산된 건 제외
    const { data: settlements } = await supabase
      .from("import_settlements")
      .select("consultation_id")
      .eq("status", "settled");

    const settledIds = new Set((settlements || []).map((s) => s.consultation_id));

    const unsettledConsultations = pendingConsultations.filter(
      (c) => !settledIds.has(c.id)
    );

    // 거래처별로 그룹핑
    const balanceByCompany: Record<
      string,
      {
        company_id: string;
        company_name: string;
        consultations: typeof unsettledConsultations;
        total_by_currency: Record<string, number>;
      }
    > = {};

    for (const c of unsettledConsultations) {
      const companyId = c.company_id;
      const companyName = c.company?.name || "";
      const currency = c.currency || "KRW";
      const amount = Number(c.total_remittance || 0);

      if (!balanceByCompany[companyId]) {
        balanceByCompany[companyId] = {
          company_id: companyId,
          company_name: companyName,
          consultations: [],
          total_by_currency: {},
        };
      }

      balanceByCompany[companyId].consultations.push(c);
      balanceByCompany[companyId].total_by_currency[currency] =
        (balanceByCompany[companyId].total_by_currency[currency] || 0) + amount;
    }

    return NextResponse.json({
      balance: Object.values(balanceByCompany),
      total_consultations: unsettledConsultations.length,
    });
  } catch (error) {
    console.error("Error fetching pending balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending balance" },
      { status: 500 }
    );
  }
}
