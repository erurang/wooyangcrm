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

    // 상담 목록 조회 (contacts_consultations 중간 테이블 조인, shipping_carriers 조인)
    let query = supabase
      .from("consultations")
      .select(
        `
        *,
        companies:company_id (
          id,
          name
        ),
        users:user_id (
          id,
          name
        ),
        contacts_consultations (
          contact_id,
          contacts (
            id,
            contact_name
          )
        ),
        shipping_carriers:shipping_carrier_id (
          id,
          name,
          code
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
    const transformedData = consultations?.map((item) => {
      // contacts_consultations에서 첫 번째 contact 정보 추출
      const contactRelation = item.contacts_consultations?.[0];
      const contact = contactRelation?.contacts;

      console.log(`[GET overseas/consultations] Item ${item.id}:`, {
        contacts_consultations: item.contacts_consultations,
        contactRelation,
        contact,
        contact_id: contact?.id || null,
      });

      return {
        ...item,
        company_name: item.companies?.name || "",
        user_name: item.users?.name || "",
        contact_id: contact?.id || null,
        contact_name: contact?.contact_name || "",
        shipping_carrier: item.shipping_carriers || null,
        companies: undefined,
        users: undefined,
        contacts_consultations: undefined,
        shipping_carriers: undefined,
      };
    });

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
      user_id,
      order_type, // 수입/수출 구분
      date,
      title,
      content,
      contact_id, // 담당자 ID
      // 해외 전용 필드 (기존)
      shipping_date,
      incoterms,
      lc_number,
      port_of_loading,
      port_of_discharge,
      // 거래 정보 필드 (신규)
      order_date,
      expected_completion_date,
      pickup_date,
      arrival_date,
      oc_number,
      product_name,
      specification,
      quantity,
      total_remittance,
      currency,
      remittance_date,
      shipping_method,
      shipping_carrier_id,
      trade_status,
      packaging_width,
      packaging_height,
      packaging_depth,
      packaging_type,
      packaging_weight,
      remarks,
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

    // 상담 등록
    const { data, error } = await supabase
      .from("consultations")
      .insert([
        {
          company_id,
          user_id,
          order_type: order_type || null,
          date,
          title: title || null,
          content,
          // 기존 해외 필드
          shipping_date: shipping_date || null,
          incoterms: incoterms || null,
          lc_number: lc_number || null,
          port_of_loading: port_of_loading || null,
          port_of_discharge: port_of_discharge || null,
          // 거래 정보 필드
          order_date: order_date || null,
          expected_completion_date: expected_completion_date || null,
          pickup_date: pickup_date || null,
          arrival_date: arrival_date || null,
          oc_number: oc_number || null,
          product_name: product_name || null,
          specification: specification || null,
          quantity: quantity || null,
          total_remittance: total_remittance || null,
          currency: currency || null,
          remittance_date: remittance_date || null,
          shipping_method: shipping_method || null,
          shipping_carrier_id: shipping_carrier_id || null,
          trade_status: trade_status || null,
          packaging_width: packaging_width || null,
          packaging_height: packaging_height || null,
          packaging_depth: packaging_depth || null,
          packaging_type: packaging_type || null,
          packaging_weight: packaging_weight || null,
          remarks: remarks || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 담당자 연결 (contacts_consultations 중간 테이블)
    if (contact_id && data) {
      const { error: linkError } = await supabase
        .from("contacts_consultations")
        .insert([
          {
            consultation_id: data.id,
            contact_id: contact_id,
            user_id: user_id || null, // user_id를 명시적으로 전달 (FK 제약조건)
          },
        ]);

      if (linkError) {
        console.error("담당자 연결 실패:", linkError.message);
        // 상담은 생성되었으므로 에러 반환하지 않고 경고만
      }
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
