import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { consultation_id, content, follow_up_date, user_id, contact_id } = body;

    console.log("[ConsultationUpdate] Request body:", body);

    if (!consultation_id || !content || !user_id || !contact_id) {
      console.log("[ConsultationUpdate] Missing required fields:", { consultation_id, content, user_id, contact_id });
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
      console.error("[ConsultationUpdate] Contact update error:", contactUpdateError);
      return NextResponse.json(
        { error: "담당자 업데이트 실패", details: contactUpdateError.message },
        { status: 500 }
      );
    }

    // 🔹 상담 내역 업데이트 (follow_up_date가 빈 문자열이면 null로 설정)
    const updateData: Record<string, unknown> = { content, user_id };
    if (follow_up_date && follow_up_date.trim() !== "") {
      updateData.follow_up_date = follow_up_date;
    } else {
      updateData.follow_up_date = null;
    }

    console.log("[ConsultationUpdate] Updating consultation with:", updateData);

    const { error: consultationUpdateError } = await supabase
      .from("consultations")
      .update(updateData)
      .eq("id", consultation_id);

    if (consultationUpdateError) {
      console.error("[ConsultationUpdate] Consultation update error:", consultationUpdateError);
      return NextResponse.json(
        { error: "상담 내역 수정 실패", details: consultationUpdateError.message },
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
