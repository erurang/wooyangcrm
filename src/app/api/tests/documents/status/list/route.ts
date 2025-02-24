import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || null;
    const type = searchParams.get("type") || "estimate";
    const status = searchParams.get("status") || "all"; // ✅ 기본값을 "all"로 설정
    const companyIds = searchParams.getAll("companyIds");
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // 🔹 상담 데이터 쿼리 생성
    let query = supabase
      .from("documents")
      .select(
        `*, contacts_documents(contacts(contact_name, level, mobile)), users(name, level)`,
        { count: "exact" }
      )
      .eq("type", type)
      .order("created_at", { ascending: false })
      .range(start, end);

    // 🔹 상태 필터 추가 (✅ "all"이 아닐 때만 적용)
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // 🔹 사용자 필터 추가 (선택적 적용)
    if (userId) query = query.eq("user_id", userId);

    // 🔹 회사 ID 필터 추가 (선택적 적용)
    if (companyIds.length > 0) query = query.in("company_id", companyIds);

    // 🔹 쿼리 실행
    const { data, error, count } = await query;
    if (error) throw error;

    const transformedDocuments = data.map((doc) => {
      const contact = doc.contacts_documents?.[0]?.contacts || {};
      const user = doc.users || {};

      return {
        ...doc,
        contact_level: contact.level || "",
        contact_name: contact.contact_name || "",
        contact_mobile: contact.mobile || "",
        user_name: user.name || "",
        user_level: user.level || "",
        contacts_documents: undefined,
        users: undefined,
      };
    });

    return NextResponse.json(
      { documents: transformedDocuments, total: count },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch documents", details: error },
      { status: 500 }
    );
  }
}
