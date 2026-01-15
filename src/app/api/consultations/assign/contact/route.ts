import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const { consultation_id, contact_id, user_id } = await request.json();

    if (!consultation_id || !contact_id || !user_id) {
      return NextResponse.json(
        { error: "필수 값이 없습니다." },
        { status: 400 }
      );
    }

    // 🔹 상담-담당자 연결 테이블에 데이터 추가
    const { error: contactInsertError } = await supabase
      .from("contacts_consultations")
      .insert([
        {
          contact_id,
          consultation_id,
          user_id,
        },
      ]);

    if (contactInsertError) {
      throw new Error("담당자 연결 추가 실패");
    }

    return NextResponse.json({ message: "담당자 연결 완료" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
