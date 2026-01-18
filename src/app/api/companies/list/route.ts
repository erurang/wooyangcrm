import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const name = searchParams.get("name") || "";
    const address = searchParams.get("address") || "";
    const companyIdsParam = searchParams.get("companyIds") || "";

    let query = supabase
      .from("companies")
      .select("*", { count: "exact" })
      .or("is_overseas.is.null,is_overseas.eq.false") // 해외거래처 제외
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false });

    if (name) query = query.ilike("name", `%${name}%`);
    if (address) query = query.ilike("address", `%${address}%`);

    if (companyIdsParam) {
      const companyIds = companyIdsParam.split(",").filter((id) => id);
      if (companyIds.length > 0) {
        query = query.in("id", companyIds);
      }
    }

    const { data: companies, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      companies,
      total: count || 0,
    });
  } catch (error) {
    console.error("Error fetching companies list:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies list" },
      { status: 500 }
    );
  }
}
