import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const {
      date,
      rnd_id,
      org_id,
      content,
      user_id,
      start_date,
      end_date,
      total_cost,
      gov_contribution,
      pri_contribution,
      participation,
    } = await request.json();

    if (!rnd_id || !org_id || !user_id || !participation) {
      return NextResponse.json(
        { error: "필수 값이 없습니다." },
        { status: 400 }
      );
    }

    // 🔹 상담 내역 추가
    const { error: insertError } = await supabase
      .from("rnds_consultations")
      .insert([
        {
          date,
          rnd_id,
          org_id,
          content,
          user_id,
          start_date,
          end_date,
          total_cost,
          gov_contribution,
          pri_contribution,
          participation,
        },
      ]);

    if (insertError) {
      throw new Error("상담 내역 추가 실패");
    }

    return NextResponse.json(
      {
        message: "상담 내역 추가 완료",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
