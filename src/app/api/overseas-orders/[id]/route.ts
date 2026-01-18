import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 발주 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data: order, error } = await supabase
      .from("overseas_orders")
      .select("*, companies(name), users(name)")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Parse items JSON
    const parsedOrder = {
      ...order,
      company_name: order.companies?.name,
      user_name: order.users?.name,
      items:
        typeof order.items === "string"
          ? JSON.parse(order.items)
          : order.items || [],
      companies: undefined,
      users: undefined,
    };

    // 첨부파일 조회
    const { data: files } = await supabase
      .from("overseas_order_files")
      .select("*")
      .eq("order_id", id)
      .order("uploaded_at", { ascending: false });

    return NextResponse.json({
      order: {
        ...parsedOrder,
        files: files || [],
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

// PATCH: 발주 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  try {
    const {
      invoice_no,
      order_date,
      shipment_date,
      arrival_date,
      currency,
      items,
      remittance_amount,
      remittance_date,
      exchange_rate,
      shipping_method,
      forwarder,
      hs_code,
      tariff_rate,
      contact_name,
      user_id,
      notes,
    } = body;

    // 총금액 계산
    const total_amount = items?.reduce(
      (sum: number, item: { amount: number }) => sum + (item.amount || 0),
      0
    );

    // 원화 환산액 계산
    const krw_amount =
      exchange_rate && remittance_amount
        ? Math.round(remittance_amount * exchange_rate)
        : null;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (invoice_no !== undefined) updateData.invoice_no = invoice_no;
    if (order_date !== undefined) updateData.order_date = order_date;
    if (shipment_date !== undefined)
      updateData.shipment_date = shipment_date || null;
    if (arrival_date !== undefined)
      updateData.arrival_date = arrival_date || null;
    if (currency !== undefined) updateData.currency = currency;
    if (items !== undefined) {
      updateData.items = items;
      updateData.total_amount = total_amount;
    }
    if (remittance_amount !== undefined)
      updateData.remittance_amount = remittance_amount || null;
    if (remittance_date !== undefined)
      updateData.remittance_date = remittance_date || null;
    if (exchange_rate !== undefined) {
      updateData.exchange_rate = exchange_rate || null;
      updateData.krw_amount = krw_amount;
    }
    if (shipping_method !== undefined)
      updateData.shipping_method = shipping_method || null;
    if (forwarder !== undefined) updateData.forwarder = forwarder || null;
    if (hs_code !== undefined) updateData.hs_code = hs_code || null;
    if (tariff_rate !== undefined)
      updateData.tariff_rate = tariff_rate || null;
    if (contact_name !== undefined)
      updateData.contact_name = contact_name || null;
    if (user_id !== undefined) updateData.user_id = user_id || null;
    if (notes !== undefined) updateData.notes = notes || null;

    const { data, error } = await supabase
      .from("overseas_orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE: 발주 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 첨부파일 먼저 삭제
    await supabase.from("overseas_order_files").delete().eq("order_id", id);

    // 발주 삭제
    const { error } = await supabase
      .from("overseas_orders")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
