import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const companyId = searchParams.get("companyId");
  const startDate = searchParams.get("startDate");

  if (!companyId || !startDate) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("documents")
      .select("id, type, status, content, created_at, total_amount")
      .eq("company_id", companyId)
      .gte("created_at", startDate);

    if (error) throw error;

    const details = data.map((doc) => ({
      id: doc.id,
      type: doc.type,
      status: doc.status,
      totalAmount: doc.total_amount ?? 0,
      createdAt: doc.created_at,
    }));

    return NextResponse.json({ details }, { status: 200 });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
