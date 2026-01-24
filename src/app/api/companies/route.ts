import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { logCompanyOperation, logUserActivity } from "@/lib/apiLogger";

/**
 * GET /api/companies
 * - mode=search: 자동완성용 검색 (id, name만 반환)
 * - 기본: 페이지네이션 리스트 (해외거래처 제외)
 *
 * Query params:
 * - mode: "search" | undefined
 * - page: number (default 1)
 * - limit: number (default 15)
 * - name: string (회사명 검색)
 * - address: string (주소 검색)
 * - contact: string (담당자 이름 검색)
 * - companyIds: string (콤마 구분 ID 목록)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode");

  try {
    // 🔹 mode=search: 자동완성용 검색
    if (mode === "search") {
      const searchTerm = searchParams.get("name");

      if (!searchTerm) {
        return NextResponse.json({ companies: [] });
      }

      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .or("is_overseas.is.null,is_overseas.eq.false")
        .ilike("name", `%${searchTerm}%`)
        .limit(30);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ companies: data });
    }

    // 🔹 기본 모드: 페이지네이션 리스트
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const name = searchParams.get("name") || "";
    const address = searchParams.get("address") || "";
    const contactName = searchParams.get("contact") || "";
    const companyIdsParam = searchParams.get("companyIds") || "";

    let companyIds: string[] = [];

    // 담당자 검색이 있는 경우 contacts 테이블에서 company_id 조회
    if (contactName) {
      const { data: contactsData, error: contactError } = await supabase
        .from("contacts")
        .select("company_id")
        .ilike("contact_name", `%${contactName}%`);

      if (contactError) {
        return NextResponse.json(
          { error: contactError.message },
          { status: 500 }
        );
      }

      companyIds = contactsData.map((c) => c.company_id);

      if (companyIds.length === 0) {
        return NextResponse.json({ companies: [], total: 0 }, { status: 200 });
      }
    }

    // companyIds 파라미터 처리
    if (companyIdsParam) {
      const paramIds = companyIdsParam.split(",").filter((id) => id);
      if (paramIds.length > 0) {
        // 담당자 검색과 함께 사용될 경우 교집합
        if (companyIds.length > 0) {
          companyIds = companyIds.filter((id) => paramIds.includes(id));
        } else {
          companyIds = paramIds;
        }
      }
    }

    let query = supabase
      .from("companies")
      .select("*", { count: "exact" })
      .or("is_overseas.is.null,is_overseas.eq.false")
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (name) query = query.ilike("name", `%${name}%`);
    if (address) query = query.ilike("address", `%${address}%`);
    if (companyIds.length > 0) query = query.in("id", companyIds);

    const { data: companies, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      companies,
      total: count || 0,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/companies
 * 새 거래처 추가
 *
 * Body:
 * - name: string (필수)
 * - address, phone, fax, email, notes, business_number, parcel: string (선택)
 * - user_id: string (로깅용)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      address,
      phone,
      fax,
      email,
      notes,
      business_number,
      parcel,
      user_id,
    } = body;

    // 동일한 이름의 거래처 존재 여부 확인
    const { data: existingCompanies, error: existingCompaniesError } =
      await supabase.from("companies").select("name").eq("name", name.trim());

    if (existingCompaniesError) throw existingCompaniesError;

    if (existingCompanies.length > 0) {
      return NextResponse.json(
        { error: "⚠️ 이미 존재하는 회사입니다." },
        { status: 400 }
      );
    }

    // companies 테이블에 거래처 추가
    const { data: newCompany, error: companyError } = await supabase
      .from("companies")
      .insert([
        { name, address, phone, fax, email, notes, business_number, parcel },
      ])
      .select()
      .single();

    if (companyError || !newCompany) {
      throw new Error("거래처 추가 실패");
    }

    // 감사 로그 기록
    if (user_id) {
      await logCompanyOperation(
        "INSERT",
        newCompany.id,
        null,
        newCompany as Record<string, unknown>,
        user_id
      );

      await logUserActivity({
        userId: user_id,
        action: "거래처 등록",
        actionType: "crud",
        targetType: "company",
        targetId: newCompany.id,
        targetName: name,
      });
    }

    return NextResponse.json({ company: { ...newCompany } }, { status: 201 });
  } catch (error) {
    console.error("Error adding company:", error);
    return NextResponse.json(
      { error: "Failed to add company" },
      { status: 500 }
    );
  }
}
