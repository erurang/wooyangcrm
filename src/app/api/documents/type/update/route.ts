import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      document_id,
      content,
      payment_method,
      contact_id,
      date,
      // 분리된 필드들
      notes,
      valid_until,
      delivery_date,
      delivery_date_note,
      total_amount,
      delivery_term,
      delivery_place,
    } = body;

    if (!document_id) {
      return NextResponse.json(
        { error: "문서 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // content는 items만 포함
    const contentData = content?.items ? { items: content.items } : { items: [] };

    const { data, error } = await supabase
      .from("documents")
      .update({
        content: contentData,
        payment_method,
        date,
        // 분리된 컬럼들
        notes: notes ?? null,
        valid_until: valid_until ?? null,
        delivery_date: delivery_date ?? null,
        delivery_date_note: delivery_date_note ?? null,
        total_amount: total_amount ?? 0,
        delivery_term: delivery_term ?? null,
        delivery_place: delivery_place ?? null,
      })
      .eq("id", document_id)
      .select()
      .single();

    if (error) throw error;

    if (contact_id) {
      await supabase
        .from("contacts_documents")
        .update({ contact_id })
        .eq("document_id", document_id);
    }

    return NextResponse.json({ document: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "문서 수정 중 오류 발생" },
      { status: 500 }
    );
  }
}
