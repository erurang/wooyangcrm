import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// PATCH: 통관비용 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      company_id,
      consultation_id,
      clearance_date,
      invoice_no,
      air_freight,
      sea_freight,
      customs_duty,
      port_charges,
      domestic_transport,
      express_freight,
      vat,
      shipping_method,
      shipping_carrier_id,
      notes,
    } = body;

    // 소계 계산 (VAT 제외)
    const subtotal =
      Number(air_freight || 0) +
      Number(sea_freight || 0) +
      Number(customs_duty || 0) +
      Number(port_charges || 0) +
      Number(domestic_transport || 0) +
      Number(express_freight || 0);

    // 총계 계산 (VAT 포함)
    const total = subtotal + Number(vat || 0);

    const { data: updatedCost, error } = await supabase
      .from("customs_costs")
      .update({
        company_id,
        consultation_id: consultation_id || null,
        clearance_date,
        invoice_no,
        air_freight: Number(air_freight || 0),
        sea_freight: Number(sea_freight || 0),
        customs_duty: Number(customs_duty || 0),
        port_charges: Number(port_charges || 0),
        domestic_transport: Number(domestic_transport || 0),
        express_freight: Number(express_freight || 0),
        subtotal,
        vat: Number(vat || 0),
        total,
        shipping_method,
        shipping_carrier_id: shipping_carrier_id || null,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ customsCost: updatedCost });
  } catch (error) {
    console.error("Error updating customs cost:", error);
    return NextResponse.json(
      { error: "Failed to update customs cost" },
      { status: 500 }
    );
  }
}

// DELETE: 통관비용 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from("customs_costs")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customs cost:", error);
    return NextResponse.json(
      { error: "Failed to delete customs cost" },
      { status: 500 }
    );
  }
}
