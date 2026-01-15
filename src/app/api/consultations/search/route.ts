import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const content = searchParams.get("content") || "";
    const userId = searchParams.get("userId") || null;

    const offset = (page - 1) * limit;

    // 🔹 상담 데이터 및 총 개수를 함께 조회
    let query = supabase
      .from("consultations")
      .select(
        `
          id,
          date,
          content,
          created_at,
          companies (id, name, fax, phone),
          users(id, name, level),
          documents (type, id, document_number, content, user_id, created_at, payment_method, notes, valid_until, delivery_date, total_amount, delivery_term, delivery_place, companies (id, name)),
          contacts_consultations (contacts (contact_name, level, mobile))
        `,
        { count: "exact" } // ✅ 한 번의 요청으로 데이터 + 총 개수 조회
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 🔹 필터 적용
    if (userId) query = query.eq("user_id", userId);
    if (startDate) query = query.gte("date", startDate);
    if (endDate) query = query.lte("date", endDate);

    // ✅ `,`로 구분된 여러 키워드 검색 (AND 조건)
    if (content) {
      const keywords = content
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean); // 공백 제거 및 빈 문자열 제거
      // 각 키워드에 대해 AND 조건으로 ilike 필터 적용
      for (const keyword of keywords) {
        query = query.ilike("content", `%${keyword}%`);
      }
    }

    // 🔹 쿼리 실행
    const { data: consultations, count: total, error } = await query;

    if (error) {
      console.error("Error fetching consultations:", error);
      return NextResponse.json(
        { error: "Failed to fetch consultations" },
        { status: 500 }
      );
    }

    // 🔹 상담 데이터에 `contact_name`, `contact_level` 추가
    const updatedConsultations = consultations?.map((consultation: any) => {
      const firstContact =
        consultation.contacts_consultations?.[0]?.contacts || {};
      return {
        ...consultation,
        contact_name: firstContact.contact_name || "", // 기본값 빈 문자열
        contact_level: firstContact.level || "", // 기본값 빈 문자열
      };
    });

    return NextResponse.json({
      consultations: updatedConsultations,
      total: total || 0,
    });
  } catch (error) {
    console.error("Error in consultations/recent API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
