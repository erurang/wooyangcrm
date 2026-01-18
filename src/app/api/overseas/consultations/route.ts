import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 해외 거래처 상담 목록 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const companyId = searchParams.get("company_id") || "";
    const keyword = searchParams.get("keyword") || "";
    const startDate = searchParams.get("start_date") || "";
    const endDate = searchParams.get("end_date") || "";

    // 먼저 해외 거래처 ID 목록 조회
    const { data: overseasCompanies, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("is_overseas", true);

    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 500 });
    }

    const overseasCompanyIds = overseasCompanies?.map((c) => c.id) || [];

    if (overseasCompanyIds.length === 0) {
      return NextResponse.json({
        consultations: [],
        total: 0,
      });
    }

    // 상담 목록 조회
    let query = supabase
      .from("consultations")
      .select(
        `
        *,
        companies:company_id (
          id,
          name
        ),
        contacts:contact_id (
          id,
          name
        ),
        users:user_id (
          id,
          name
        )
      `,
        { count: "exact" }
      )
      .in("company_id", overseasCompanyIds)
      .range((page - 1) * limit, page * limit - 1)
      .order("date", { ascending: false });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    if (keyword) {
      query = query.ilike("content", `%${keyword}%`);
    }

    if (startDate) {
      query = query.gte("date", startDate);
    }

    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data: consultations, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data
    const transformedData = consultations?.map((item) => ({
      ...item,
      company_name: item.companies?.name || "",
      contact_name: item.contacts?.name || "",
      user_name: item.users?.name || "",
      companies: undefined,
      contacts: undefined,
      users: undefined,
    }));

    return NextResponse.json({
      consultations: transformedData,
      total: count || 0,
    });
  } catch (error) {
    console.error("Error fetching overseas consultations:", error);
    return NextResponse.json(
      { error: "Failed to fetch overseas consultations" },
      { status: 500 }
    );
  }
}

// POST: 해외 거래처 상담 추가
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      company_id,
      contact_id,
      user_id,
      date,
      content,
      status,
      priority,
      // 해외 전용 필드
      shipping_date,
      incoterms,
      lc_number,
      port_of_loading,
      port_of_discharge,
    } = body;

    // 필수 필드 검증
    if (!company_id || !user_id || !date || !content) {
      return NextResponse.json(
        {
          error: "필수 필드(company_id, user_id, date, content)가 누락되었습니다.",
        },
        { status: 400 }
      );
    }

    // 해외 거래처인지 확인
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("is_overseas")
      .eq("id", company_id)
      .single();

    if (companyError || !company?.is_overseas) {
      return NextResponse.json(
        { error: "해외 거래처만 등록 가능합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("consultations")
      .insert([
        {
          company_id,
          contact_id,
          user_id,
          date,
          content,
          status,
          priority,
          shipping_date,
          incoterms,
          lc_number,
          port_of_loading,
          port_of_discharge,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ consultation: data }, { status: 201 });
  } catch (err) {
    console.error("Error adding overseas consultation:", err);
    return NextResponse.json(
      { error: "Failed to add overseas consultation" },
      { status: 400 }
    );
  }
}
