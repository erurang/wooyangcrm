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
      status,
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

    // document_number 자동 생성 (예: EST-20250121-001)
    const typePrefix = type === "estimate" ? "EST" : type === "order" ? "ORD" : type === "requestQuote" ? "RQ" : "DOC";
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    // 오늘 날짜의 마지막 문서 번호 조회
    const { data: lastDoc } = await supabase
      .from("documents")
      .select("document_number")
      .like("document_number", `${typePrefix}-${dateStr}-%`)
      .order("document_number", { ascending: false })
      .limit(1)
      .single();

    let seq = 1;
    if (lastDoc?.document_number) {
      const lastSeq = parseInt(lastDoc.document_number.split("-").pop() || "0", 10);
      seq = lastSeq + 1;
    }
    const document_number = `${typePrefix}-${dateStr}-${seq.toString().padStart(3, "0")}`;

    const { data, error } = await supabase
      .from("documents")
      .insert([
        {
          document_number,
          content: contentData,
          user_id,
          payment_method,
          consultation_id,
          company_id,
          type,
          date,
          status: status || "pending",
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
