import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 입고정산 단건 조회 (항목 포함)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 정산 마스터 조회
    const { data: settlement, error } = await supabase
      .from("import_settlements")
      .select(
        `
        *,
        company:company_id (id, name),
        settled_by_user:settled_by (id, name)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!settlement) {
      return NextResponse.json(
        { error: "정산 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 정산 항목들 조회
    const { data: items } = await supabase
      .from("import_settlement_items")
      .select(
        `
        *,
        customs_cost:customs_cost_id (
          id,
          invoice_no,
          clearance_date
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
      .eq("settlement_id", id)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      settlement: {
        ...settlement,
        items: items || [],
        item_count: (items || []).length,
        total_item_amount: (items || []).reduce(
          (sum: number, item: any) => sum + Number(item.item_amount || 0),
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching import settlement:", error);
    return NextResponse.json(
      { error: "Failed to fetch import settlement" },
      { status: 500 }
    );
  }
}

// PATCH: 입고정산 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      settlement_date,
      remittance_date,
      remittance_amount,
      remittance_currency,
      remittance_original,
      exchange_rate,
      tax_invoice_date,
      tax_invoice_number,
      supply_amount,
      vat_amount,
      status,
      settled_by,
      notes,
      items, // 항목 수정 시
    } = body;

    // 세금계산서 합계
    const taxInvoiceTotal = Number(supply_amount || 0) + Number(vat_amount || 0);

    // 환차손/통관료 계산
    const exchangeLossCustoms = taxInvoiceTotal - Number(remittance_amount || 0);

    const updateData: Record<string, unknown> = {
      settlement_date: settlement_date || null,
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
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };

    // 정산 완료 처리
    if (status === "settled") {
      updateData.status = "settled";
      updateData.settled_at = new Date().toISOString();
      updateData.settled_by = settled_by || null;
    } else if (status === "pending") {
      updateData.status = "pending";
      updateData.settled_at = null;
      updateData.settled_by = null;
    }

    // 마스터 업데이트
    const { data: updatedSettlement, error } = await supabase
      .from("import_settlements")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        company:company_id (id, name)
      `
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 항목 업데이트 (있는 경우)
    if (items && Array.isArray(items)) {
      // 기존 항목 삭제
      await supabase
        .from("import_settlement_items")
        .delete()
        .eq("settlement_id", id);

      // 새 항목 추가
      if (items.length > 0) {
        const itemsToInsert = items.map((item: any) => ({
          settlement_id: id,
          customs_cost_id: item.customs_cost_id || null,
          consultation_id: item.consultation_id || null,
          item_amount: Number(item.item_amount || 0),
          item_currency: item.item_currency || "KRW",
        }));

        await supabase.from("import_settlement_items").insert(itemsToInsert);
      }
    }

    // 업데이트된 항목 조회
    const { data: updatedItems } = await supabase
      .from("import_settlement_items")
      .select("*")
      .eq("settlement_id", id);

    return NextResponse.json({
      settlement: {
        ...updatedSettlement,
        items: updatedItems || [],
        item_count: (updatedItems || []).length,
      },
    });
  } catch (error) {
    console.error("Error updating import settlement:", error);
    return NextResponse.json(
      { error: "Failed to update import settlement" },
      { status: 500 }
    );
  }
}

// DELETE: 입고정산 삭제 (CASCADE로 항목도 함께 삭제됨)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from("import_settlements")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting import settlement:", error);
    return NextResponse.json(
      { error: "Failed to delete import settlement" },
      { status: 500 }
    );
  }
}
