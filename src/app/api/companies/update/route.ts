import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      address,
      phone,
      fax,
      email,
      notes,
      business_number,
      parcel,
      // industry
    } = body; // `id`와 `contacts` 분리

    if (!id) {
      return NextResponse.json(
        { error: "거래처 ID가 없습니다." },
        { status: 400 }
      );
    }
    // return;

    const { data: updatedCompany, error: companyError } = await supabase
      .from("companies")
      .update({
        name,
        address,
        phone,
        fax,
        email,
        notes,
        business_number,
        parcel,
      })
      .eq("id", id)
      .select()
      .single();

    if (companyError) throw companyError;

    return NextResponse.json({
      company: { ...updatedCompany },
    });
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json({ error: "거래처 수정 실패" }, { status: 500 });
  }
}
