import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const contactName = searchParams.get("contact") || "";
    const email = searchParams.get("email") || "";
    const mobile = searchParams.get("mobile") || "";
    const companyName = searchParams.get("company") || "";

    // 🔹 Offset 계산
    const offset = (page - 1) * limit;

    // 🔹 쿼리 빌더 시작
    let query = supabase
      .from("contacts")
      .select(
        `id, contact_name, mobile, department, level, email, company_id, companies!inner(id, name), note`,
        { count: "exact" }
      );

    // 🔹 필터 적용
    if (contactName) query = query.ilike("contact_name", `%${contactName}%`);
    if (email) query = query.ilike("email", `%${email}%`);
    if (mobile) query = query.ilike("mobile", `%${mobile}%`);
    if (companyName) query = query.ilike("companies.name", `%${companyName}%`);

    // 🔹 정렬 및 페이지네이션 적용
    query = query
      .order("company_id", { ascending: true })
      .range(offset, offset + limit - 1);

    // 🔹 데이터 조회
    const { data: contacts, count, error } = await query;

    if (error) throw error;

    return NextResponse.json({ contacts, total: count ?? 0 });
  } catch (error) {
    console.error("🚨 Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts", details: error },
      { status: 500 }
    );
  }
}
