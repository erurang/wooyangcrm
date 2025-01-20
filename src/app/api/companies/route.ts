import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient"; // Supabase 클라이언트 가져오기

export async function GET(req: NextRequest) {
  // 쿼리 파라미터에서 필터 조건과 페이지, 리미트 값을 가져옵니다.
  const { searchParams } = req.nextUrl;
  const name = searchParams.get("name") || "";
  const address = searchParams.get("address") || "";

  const page = parseInt(searchParams.get("page") || "1", 10); // 기본값은 1
  const limit = parseInt(searchParams.get("limit") || "15", 10); // 기본값은 15

  try {
    // 기본 쿼리: companies 테이블에서 회사 목록 가져오기
    let query = supabase.from("companies").select("*");

    // 거래처명 필터
    if (name) {
      query = query.ilike("name", `%${name}%`); // 거래처명이 포함된 데이터만 조회
    }

    // 주소 필터
    if (address) {
      query = query.ilike("address", `%${address}%`); // 주소 필터링
    }

    // 페이지와 리미트 적용
    query = query.range((page - 1) * limit, page * limit - 1); // 페이지네이션

    const { data: companies, error: companyError } = await query;

    if (companyError) {
      return NextResponse.json(
        { error: companyError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(companies, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
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
