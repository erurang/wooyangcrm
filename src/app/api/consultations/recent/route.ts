import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const userId = searchParams.get("userId") || null;
    const companyIds = searchParams.getAll("companyIds"); // 거래처 검색
    const content = searchParams.get("content") || ""; // 상담내용 검색

    const offset = (page - 1) * limit;

    // 🔹 상담 데이터 쿼리 생성
    let query = supabase
      .from("consultations")
      .select(
        `
          id,
          date,
          title,
          content,
          contact_method,
          created_at,
          companies (id, name, fax, phone),
          users(id, name, level),
          documents (type, id, document_number, status, content, user_id, created_at, payment_method, notes, valid_until, delivery_date, total_amount, delivery_term, delivery_place, companies (id, name)),
          contacts_consultations (contacts (contact_name, level, mobile))
        `,
        { count: "exact" }
      )
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 🔹 필터 적용
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

    // 상담내용 검색 (쉼표로 구분된 여러 키워드 AND 조건)
    if (content) {
      const keywords = content
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);
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

    // 🔹 파일 개수 조회
    const consultationIds = consultations?.map((c: { id: string }) => c.id) || [];
    let fileCounts: Record<string, number> = {};

    if (consultationIds.length > 0) {
      const { data: fileData } = await supabase
        .from("consultation_files")
        .select("consultation_id")
        .in("consultation_id", consultationIds);

      fileData?.forEach((file: { consultation_id: string }) => {
        fileCounts[file.consultation_id] = (fileCounts[file.consultation_id] || 0) + 1;
      });
    }

    // 🔹 상담 데이터에 `contact_name`, `contact_level`, `file_count` 추가
    const updatedConsultations = consultations?.map((consultation: any) => {
      const firstContact =
        consultation.contacts_consultations?.[0]?.contacts || {};
      return {
        ...consultation,
        contact_name: firstContact.contact_name || "",
        contact_level: firstContact.level || "",
        file_count: fileCounts[consultation.id] || 0,
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
