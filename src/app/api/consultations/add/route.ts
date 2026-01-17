import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const { company_id, content, follow_up_date, user_id, date, title, contact_method } =
      await request.json();

    if (!company_id || !content || !user_id) {
      return NextResponse.json(
        { error: "필수 값이 없습니다." },
        { status: 400 }
      );
    }

    // 🔹 상담 내역 추가
    const { data: insertedConsultation, error: insertError } = await supabase
      .from("consultations")
      .insert([
        {
          date,
          company_id,
          content,
          follow_up_date: follow_up_date || null,
          user_id,
          title: title || null,
          contact_method: contact_method || "email",
        },
      ])
      .select("id")
      .single();

    if (insertError || !insertedConsultation) {
      throw new Error("상담 내역 추가 실패");
    }

    return NextResponse.json(
      {
        consultation_id: insertedConsultation.id,
        message: "상담 내역 추가 완료",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
