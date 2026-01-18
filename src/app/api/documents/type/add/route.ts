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
      // 분리된 필드들
      notes,
      valid_until,
      delivery_date,
      total_amount,
      delivery_term,
      delivery_place,
    } = body;

    if (!user_id || !consultation_id || !company_id || !type) {
      return NextResponse.json(
        { error: "필수 값이 없습니다." },
        { status: 400 }
      );
    }

    // content는 items만 포함
    const contentData = content?.items ? { items: content.items } : { items: [] };

    const { data, error } = await supabase
      .from("documents")
      .insert([
        {
          content: contentData,
          user_id,
          payment_method,
          consultation_id,
          company_id,
          type,
          date,
          // 분리된 컬럼들
          notes: notes || null,
          valid_until: valid_until || null,
          delivery_date: delivery_date || null,
          total_amount: total_amount || 0,
          delivery_term: delivery_term || null,
          delivery_place: delivery_place || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const document_id = data.id;

    // 담당자 연결
    if (contact_id) {
      await supabase.from("contacts_documents").insert({
        document_id,
        contact_id,
        user_id,
      });
    }

    return NextResponse.json({ document: data }, { status: 201 });
  } catch (error) {
    console.error("Error adding document:", error);
    return NextResponse.json(
      { error: "문서 추가 중 오류 발생" },
      { status: 500 }
    );
  }
}
