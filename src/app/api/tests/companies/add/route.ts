import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const { name, address, phone, fax, email, notes, business_number, parcel } =
      body;

    // 🔹 Step 1: 동일한 이름의 거래처 존재 여부 확인
    const { data: existingCompanies, error: existingCompaniesError } =
      await supabase.from("companies").select("name").eq("name", name.trim());

    if (existingCompaniesError) throw existingCompaniesError;

    if (existingCompanies.length > 0) {
      return NextResponse.json(
        { error: "⚠️ 이미 존재하는 회사입니다." },
        { status: 400 }
      );
    }

    // 🔹 Step 2: `companies` 테이블에 거래처 추가
    const { data: newCompany, error: companyError } = await supabase
      .from("companies")
      .insert([
        { name, address, phone, fax, email, notes, business_number, parcel },
      ])
      .select()
      .single();

    if (companyError || !newCompany) {
      console.log("나임??");
      throw new Error("거래처 추가 실패");
    }

    return NextResponse.json({
      company: { ...newCompany },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add company" },
      { status: 500 }
    );
  }
}
