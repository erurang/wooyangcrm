import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PATCH(request: Request) {
  try {
    const { consultation_id, content, follow_up_date, user_id, contact_id } =
      await request.json();

    if (!consultation_id || !content || !user_id || !contact_id) {
      return NextResponse.json(
        { error: "필수 값이 없습니다." },
        { status: 400 }
      );
    }

    // 🔹 상담-담당자 업데이트
    const { error: contactUpdateError } = await supabase
      .from("contacts_consultations")
      .update({ contact_id })
      .eq("consultation_id", consultation_id);

    if (contactUpdateError) {
      return NextResponse.json(
        { error: "담당자 업데이트 실패" },
        { status: 500 }
      );
    }

    // 🔹 상담 내역 업데이트
    const { error: consultationUpdateError } = await supabase
      .from("consultations")
      .update({ content, follow_up_date, user_id })
      .eq("id", consultation_id);

    if (consultationUpdateError) {
      return NextResponse.json(
        { error: "상담 내역 수정 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "상담 내역 수정 완료" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
