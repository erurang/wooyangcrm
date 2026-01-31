import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 입고정산 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const companyId = searchParams.get("company_id") || "";
    const status = searchParams.get("status") || "";
    const startDate = searchParams.get("start_date") || "";
    const endDate = searchParams.get("end_date") || "";

    let query = supabase
      .from("import_settlements")
      .select(
        `
        *,
        company:company_id (
          id,
          name
        ),
        settled_by_user:settled_by (
          id,
          name
        )
      `,
        { count: "exact" }
      )
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("settlement_date", startDate);
    }

    if (endDate) {
      query = query.lte("settlement_date", endDate);
    }

    const { data: settlements, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 각 정산의 항목 수와 합계 조회
    const settlementIds = (settlements || []).map((s: any) => s.id);

    if (settlementIds.length > 0) {
      const { data: itemStats } = await supabase
        .from("import_settlement_items")
        .select("settlement_id, item_amount")
        .in("settlement_id", settlementIds);

      // 정산별 항목 수와 합계 계산
      const statsMap = new Map<string, { count: number; total: number }>();
      (itemStats || []).forEach((item: any) => {
        const existing = statsMap.get(item.settlement_id) || { count: 0, total: 0 };
        statsMap.set(item.settlement_id, {
          count: existing.count + 1,
          total: existing.total + Number(item.item_amount || 0),
        });
      });

      // 정산에 항목 통계 추가
      (settlements || []).forEach((s: any) => {
        const stats = statsMap.get(s.id);
        s.item_count = stats?.count || 0;
        s.total_item_amount = stats?.total || 0;
      });
    }

    return NextResponse.json({
      settlements: settlements || [],
      total: count || 0,
    });
  } catch (error) {
    console.error("Error fetching import settlements:", error);
    return NextResponse.json(
      { error: "Failed to fetch import settlements" },
      { status: 500 }
    );
  }
}

// POST: 입고정산 생성 (다건 정산)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_id,
      settlement_date,
      items, // 선택한 통관 건들
      remittance_date,
      remittance_amount,
      remittance_currency,
      remittance_original,
      exchange_rate,
      tax_invoice_date,
      tax_invoice_number,
      supply_amount,
      vat_amount,
      notes,
      created_by,
    } = body;

    // 필수값 검증
    if (!company_id) {
      return NextResponse.json(
        { error: "거래처를 선택해주세요." },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "정산할 통관 건을 선택해주세요." },
        { status: 400 }
      );
    }

    // 세금계산서 합계
    const taxInvoiceTotal = Number(supply_amount || 0) + Number(vat_amount || 0);

    // 환차손/통관료 계산: 세금계산서 합계 - 송금액
    const exchangeLossCustoms = taxInvoiceTotal - Number(remittance_amount || 0);

    // 1. 정산 마스터 생성
    const { data: newSettlement, error: settlementError } = await supabase
      .from("import_settlements")
      .insert([
        {
          company_id,
          settlement_date: settlement_date || new Date().toISOString().split("T")[0],
          remittance_date: remittance_date || null,
          remittance_amount: Number(remittance_amount || 0),
          remittance_currency: remittance_currency || "KRW",
          remittance_original: Number(remittance_original || 0),
          exchange_rate: exchange_rate ? Number(exchange_rate) : null,
          tax_invoice_date: tax_invoice_date || null,
          tax_invoice_number: tax_invoice_number || null,
          supply_amount: Number(supply_amount || 0),
          vat_amount: Number(vat_amount || 0),
          tax_invoice_total: taxInvoiceTotal,
          exchange_loss_customs: exchangeLossCustoms,
          status: "pending",
          notes: notes || null,
          created_by: created_by || null,
        },
      ])
      .select()
      .single();

    if (settlementError) {
      return NextResponse.json({ error: settlementError.message }, { status: 500 });
    }

    // 2. 정산 항목들 생성
    const itemsToInsert = items.map((item: any) => ({
      settlement_id: newSettlement.id,
      customs_cost_id: item.customs_cost_id || null,
      consultation_id: item.consultation_id || null,
      item_amount: Number(item.item_amount || 0),
      item_currency: item.item_currency || "KRW",
    }));

    const { error: itemsError } = await supabase
      .from("import_settlement_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // 롤백: 마스터 삭제
      await supabase.from("import_settlements").delete().eq("id", newSettlement.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    // 3. 완성된 정산 조회
    const { data: completeSettlement } = await supabase
      .from("import_settlements")
      .select(
        `
        *,
        company:company_id (id, name)
      `
      )
      .eq("id", newSettlement.id)
      .single();

    return NextResponse.json({ settlement: completeSettlement });
  } catch (error) {
    console.error("Error creating import settlement:", error);
    return NextResponse.json(
      { error: "Failed to create import settlement" },
      { status: 500 }
    );
  }
}
