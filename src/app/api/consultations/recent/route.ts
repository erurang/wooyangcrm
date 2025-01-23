import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || ""; // 회사명 및 내용 검색
    const userName = searchParams.get("user") || ""; // 상담자 이름 검색
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const offset = (page - 1) * limit;

    // 상담자 이름 -> UUID 변환
    let userId: string | null = null;
    if (userName) {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .ilike("name", `%${userName}%`)
        .single();

      if (userError) {
        console.error("Error fetching user ID:", userError);
        return NextResponse.json(
          { error: "Failed to fetch user ID" },
          { status: 500 }
        );
      }

      userId = user?.id || null;
    }

    // 회사 이름 검색 처리
    let companyIds: string[] = [];
    if (search) {
      const { data: companies, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .ilike("name", `%${search}%`);

      if (companyError) {
        console.error("Error fetching company IDs:", companyError);
        return NextResponse.json(
          { error: "Failed to fetch company IDs" },
          { status: 500 }
        );
      }

      companyIds = companies.map((company) => company.id);
    }

    // 기본 쿼리 생성
    let query = supabase
      .from("consultations")
      .select(
        `
          id,
          date,
          content,
          contact,
          companies (id, name),
          users!consultations_user_id_fkey (id, name),
          documents (type, id, document_number, content, user_id)
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

    const { data: consultations, error } = await query;

    if (error) {
      console.error("Error fetching consultations:", error);
      return NextResponse.json(
        { error: "Failed to fetch consultations" },
        { status: 500 }
      );
    }

    // 총 레코드 수 계산 (필터 포함)
    let totalQuery = supabase
      .from("consultations")
      .select("id", { count: "exact", head: true });

    // 회사 ID 필터 추가
    if (companyIds.length > 0) {
      totalQuery = totalQuery.in("company_id", companyIds);
    }

    // 상담자 검색 조건 추가
    if (userId) {
      totalQuery = totalQuery.eq("user_id", userId);
    }

    // 날짜 필터 조건 추가
    if (startDate && endDate) {
      totalQuery = totalQuery.gte("date", startDate).lte("date", endDate);
    } else if (startDate) {
      totalQuery = totalQuery.gte("date", startDate);
    } else if (endDate) {
      totalQuery = totalQuery.lte("date", endDate);
    }

    const { count: total, error: totalError } = await totalQuery;

    if (totalError) {
      console.error("Error fetching total consultations count:", totalError);
      return NextResponse.json(
        { error: "Failed to fetch total consultations count" },
        { status: 500 }
      );
    }

    return NextResponse.json({ consultations, total: total || 0 });
  } catch (error) {
    console.error("Error in consultations/recent API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
