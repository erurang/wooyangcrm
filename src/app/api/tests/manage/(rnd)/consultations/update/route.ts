import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PATCH(request: Request) {
  try {
    const {
      consultation_id,
      rnd_id,
      content,
      user_id,
      start_date,
      end_date,
      total_cost,
      gov_contribution,
      pri_contribution,
      participation,
    } = await request.json();

    if (!consultation_id || !rnd_id || !user_id || !participation) {
      return NextResponse.json(
        { error: "필수 값이 없습니다." },
        { status: 400 }
      );
    }

    // 🔹 상담 내역 업데이트
    const { error: consultationUpdateError } = await supabase
      .from("rnds_consultations")
      .update({
        content,
        user_id,
        start_date,
        end_date,
        total_cost,
        gov_contribution,
        pri_contribution,
        participation,
      })
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
