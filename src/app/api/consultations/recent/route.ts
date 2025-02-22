import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || ""; // 회사명 및 내용 검색
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const userId = searchParams.get("userId") || null; // ✅ 프론트에서 직접 넘김
    const companyIds = searchParams.getAll("companyIds"); // ✅ 프론트에서 직접 넘김

    const offset = (page - 1) * limit;

    // 🔹 상담 데이터 쿼리 생성
    let query = supabase
      .from("consultations")
      .select(
        `
          id,
          date,
          content,
          companies (id, name ,fax),
          users(id, name, level),
          documents (type, id, document_number, content, user_id, created_at , payment_method),
          contacts_consultations (contacts (contact_name, level, mobile))
        `
      )
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);

    // 회사 ID 필터 추가
    if (companyIds.length > 0) {
      query = query.in("company_id", companyIds);
    }

    // 상담자 검색 조건 추가
    if (userId) {
      query = query.eq("user_id", userId);
    }

    // 날짜 필터 조건 추가
    if (startDate && endDate) {
      query = query.gte("date", startDate).lte("date", endDate);
    } else if (startDate) {
      query = query.gte("date", startDate);
    } else if (endDate) {
      query = query.lte("date", endDate);
    }

    // 🔹 총 레코드 수 쿼리 (필터 적용)
    let totalQuery = supabase
      .from("consultations")
      .select("id", { count: "exact", head: true });

    if (companyIds.length > 0) {
      totalQuery = totalQuery.in("company_id", companyIds);
    }
    if (userId) {
      totalQuery = totalQuery.eq("user_id", userId);
    }
    if (startDate && endDate) {
      totalQuery = totalQuery.gte("date", startDate).lte("date", endDate);
    } else if (startDate) {
      totalQuery = totalQuery.gte("date", startDate);
    } else if (endDate) {
      totalQuery = totalQuery.lte("date", endDate);
    }

    // 🔹 병렬 실행 (상담 데이터 & 총 개수)
    const [
      { data: consultations, error },
      { count: total, error: totalError },
    ] = await Promise.all([query, totalQuery]);

    if (error) {
      console.error("Error fetching consultations:", error);
      return NextResponse.json(
        { error: "Failed to fetch consultations" },
        { status: 500 }
      );
    }
    if (totalError) {
      console.error("Error fetching total consultations count:", totalError);
      return NextResponse.json(
        { error: "Failed to fetch total consultations count" },
        { status: 500 }
      );
    }

    let updatedConsultations = null;

    if (consultations) {
      // 🔹 상담 데이터에 `contact_name`, `contact_level` 추가
      updatedConsultations = consultations.map((consultation) => {
        const firstContact =
          consultation.contacts_consultations?.[0]?.contacts || {};
        return {
          ...consultation,
          contact_name: (firstContact as any).contact_name || "", // 기본값 빈 문자열
          contact_level: (firstContact as any).level || "", // 기본값 빈 문자열
        };
      });
    }

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
