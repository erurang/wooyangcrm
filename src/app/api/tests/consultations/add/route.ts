import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const { company_id, content, follow_up_date, user_id } =
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
          date: new Date().toISOString().split("T")[0],
          company_id,
          content,
          follow_up_date: follow_up_date || null,
          user_id,
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
