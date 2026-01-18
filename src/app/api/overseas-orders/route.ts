import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 발주 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const orderType = searchParams.get("orderType"); // import or export
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const invoiceNo = searchParams.get("invoiceNo") || "";

    let query = supabase
      .from("overseas_orders")
      .select("*, companies(name), users(name)", { count: "exact" })
      .range((page - 1) * limit, page * limit - 1)
      .order("order_date", { ascending: false });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    if (orderType) {
      query = query.eq("order_type", orderType);
    }

    if (invoiceNo) {
      query = query.ilike("invoice_no", `%${invoiceNo}%`);
    }

    const { data: orders, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse items JSON and add company_name, user_name
    const parsedOrders = orders?.map((order) => ({
      ...order,
      company_name: order.companies?.name,
      user_name: order.users?.name,
      items:
        typeof order.items === "string"
          ? JSON.parse(order.items)
          : order.items || [],
      companies: undefined,
      users: undefined,
    }));

    return NextResponse.json({
      orders: parsedOrders,
      total: count || 0,
    });
  } catch (error) {
    console.error("Error fetching overseas orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch overseas orders" },
      { status: 500 }
    );
  }
}

// POST: 발주 추가
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_id,
      order_type,
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
    ) || 0;

    // 원화 환산액 계산
    const krw_amount = exchange_rate
      ? Math.round(remittance_amount * exchange_rate)
      : null;

    const { data: newOrder, error } = await supabase
      .from("overseas_orders")
      .insert([
        {
          company_id,
          order_type: order_type || "import",
          invoice_no,
          order_date,
          shipment_date: shipment_date || null,
          arrival_date: arrival_date || null,
          currency: currency || "USD",
          items: items || [],
          total_amount,
          remittance_amount: remittance_amount || null,
          remittance_date: remittance_date || null,
          exchange_rate: exchange_rate || null,
          krw_amount,
          shipping_method: shipping_method || null,
          forwarder: forwarder || null,
          hs_code: hs_code || null,
          tariff_rate: tariff_rate || null,
          contact_name: contact_name || null,
          user_id: user_id || null,
          notes: notes || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding order:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ order: newOrder });
  } catch (error) {
    console.error("Error adding overseas order:", error);
    return NextResponse.json(
      { error: "Failed to add overseas order" },
      { status: 500 }
    );
  }
}
