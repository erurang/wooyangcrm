import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      content,
      user_id,
      payment_method,
      consultation_id,
      company_id,
      type,
      contact_id,
      date,
    } = body;

    if (!content || !user_id || !consultation_id || !company_id || !type) {
      return NextResponse.json(
        { error: "필수 값이 없습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("documents")
      .insert([
        {
          content,
          user_id,
          payment_method,
          consultation_id,
          company_id,
          type,
          date,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const document_id = data.id;

    if (contact_id) {
      await supabase.from("contacts_documents").insert({
        document_id,
        contact_id,
        user_id,
      });
    }

    return NextResponse.json({ document: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "문서 추가 중 오류 발생" },
      { status: 500 }
    );
  }
}
