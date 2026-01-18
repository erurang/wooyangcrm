import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 통관비용 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const companyId = searchParams.get("company_id") || "";
    const shippingMethod = searchParams.get("shipping_method") || "";
    const forwarder = searchParams.get("forwarder") || "";
    const startDate = searchParams.get("start_date") || "";
    const endDate = searchParams.get("end_date") || "";

    let query = supabase
      .from("customs_costs")
      .select(
        `
        *,
        companies:company_id (
          id,
          name
        )
      `,
        { count: "exact" }
      )
      .range((page - 1) * limit, page * limit - 1)
      .order("clearance_date", { ascending: false });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    if (shippingMethod) {
      query = query.eq("shipping_method", shippingMethod);
    }

    if (forwarder) {
      query = query.ilike("forwarder", `%${forwarder}%`);
    }

    if (startDate) {
      query = query.gte("clearance_date", startDate);
    }

    if (endDate) {
      query = query.lte("clearance_date", endDate);
    }

    const { data: customsCosts, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to include company_name
    const transformedData = customsCosts?.map((item) => ({
      ...item,
      company_name: item.companies?.name || "",
      companies: undefined,
    }));

    return NextResponse.json({
      customsCosts: transformedData,
      total: count || 0,
    });
  } catch (error) {
    console.error("Error fetching customs costs:", error);
    return NextResponse.json(
      { error: "Failed to fetch customs costs" },
      { status: 500 }
    );
  }
}

// POST: 통관비용 추가
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_id,
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
      forwarder,
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

    const { data: newCost, error } = await supabase
      .from("customs_costs")
      .insert([
        {
          company_id,
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
          forwarder,
          notes,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ customsCost: newCost });
  } catch (error) {
    console.error("Error adding customs cost:", error);
    return NextResponse.json(
      { error: "Failed to add customs cost" },
      { status: 500 }
    );
  }
}
