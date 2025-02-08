import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name") || "";
  const address = searchParams.get("address") || "";
  const contactName = searchParams.get("contact") || ""; // 담당자 이름 필터
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "15", 10);

  try {
    let companyIds: string[] = [];

    // 🔹 1️⃣ 담당자 검색이 있는 경우 `contacts` 테이블에서 `company_id` 조회
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

      // 🔹 검색된 담당자가 없으면 바로 빈 배열 반환
      if (companyIds.length === 0) {
        return NextResponse.json({ companies: [], total: 0 }, { status: 200 });
      }
    }

    // 🔹 2️⃣ `companies` 테이블에서 검색 (담당자 필터 포함)
    let query = supabase
      .from("companies")
      .select("*", { count: "exact" })
      .ilike("name", `%${name}%`)
      .ilike("address", `%${address}%`)
      .order("name", { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    // 🔹 3️⃣ `company_id` 필터 추가 (담당자 검색이 있을 경우)
    if (companyIds.length > 0) {
      query = query.in("id", companyIds);
    }

    const { data: companies, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        companies,
        total: count,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST 요청: 회사 추가하기
export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // 요청에서 JSON 데이터 파싱
    const { name, address, phone, fax, email } = body;

    // 필수 데이터 확인
    if (!name || !address || !phone || !email) {
      return NextResponse.json(
        { error: "모든 필수 필드(name, address, phone, email)를 입력하세요." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("companies")
      .insert([{ name, address, phone, fax, email }]); // 새로운 데이터 삽입

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 }); // 성공 시 생성된 데이터 반환
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
}
