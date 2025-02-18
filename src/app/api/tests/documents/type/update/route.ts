import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { document_id, content, payment_method, contact_id } = body;

    if (!document_id) {
      return NextResponse.json(
        { error: "문서 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("documents")
      .update({ content, payment_method })
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
