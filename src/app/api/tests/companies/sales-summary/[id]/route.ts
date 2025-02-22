import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("??");
  const { id } = await params;
  const { searchParams } = req.nextUrl;

  const startDate = searchParams.get("startDate") || "2024-01-01";
  const endDate = searchParams.get("endDate") || "2024-12-31";

  if (!id) {
    return NextResponse.json({ error: "Missing company ID" }, { status: 400 });
  }

  // 🔹 Supabase RPC 호출
  const { data, error } = await supabase.rpc("get_company_sales_details", {
    company_param: id,
    start_date: startDate,
    end_date: endDate,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
