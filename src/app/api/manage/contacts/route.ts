import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const contactName = searchParams.get("contact") || "";
    const email = searchParams.get("email") || "";
    const mobile = searchParams.get("mobile") || "";
    const offset = (page - 1) * limit;

    // 🔹 전체 개수를 정확하게 가져오기 위한 별도 쿼리
    const { count, error: countError } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    let query = supabase
      .from("contacts")
      .select(
        `id, contact_name, mobile, department, level, email, company_id,
        companies(name)`,
        { count: "exact" } // 🔥 count 포함
      )
      .order("companies(name)", { ascending: true })
      .range(offset, offset + limit - 1);

    // 🔹 `contact_name` 필터링
    if (contactName) {
      query = query.ilike("contact_name", `%${contactName}%`);
    }

    // 🔹 `email` 필터링
    if (email) {
      query = query.ilike("email", `%${email}%`);
    }

    // 🔹 `mobile` 필터링
    if (mobile) {
      query = query.ilike("mobile", `%${mobile}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ contacts: data, total: count });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}
