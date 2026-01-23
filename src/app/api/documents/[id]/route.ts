import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
  }

  try {
    // 문서 조회 (회사 정보 포함)
    const { data: document, error } = await supabase
      .from("documents")
      .select(`
        *,
        user:users!documents_user_id_fkey(id, name, level),
        companies(id, name, phone, fax)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching document:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // contacts_documents 테이블에서 담당자 정보 가져오기
    let contactInfo: { contact_name?: string; level?: string } | null = null;
    const { data: contactDoc } = await supabase
      .from("contacts_documents")
      .select(`
        contacts(id, contact_name, level)
      `)
      .eq("document_id", id)
      .maybeSingle();

    if (contactDoc?.contacts) {
      const contacts = contactDoc.contacts as unknown;
      // contacts could be array or single object
      if (Array.isArray(contacts) && contacts.length > 0) {
        contactInfo = contacts[0] as { contact_name: string; level: string };
      } else if (contacts && typeof contacts === "object") {
        contactInfo = contacts as { contact_name: string; level: string };
      }
    }

    // 회사 정보 처리
    const companyData = document.companies as { id: string; name: string; phone?: string; fax?: string } | null;

    // 모달에서 사용하기 쉬운 형식으로 변환
    // 외부 컬럼 우선, content fallback
    const formattedDocument = {
      id: document.id,
      document_number: document.document_number,
      type: document.type,
      status: document.status,
      date: document.created_at,
      content: document.content,
      // 담당자 정보
      contact_name: contactInfo?.contact_name || document.content?.contact_name,
      contact_level: contactInfo?.level || document.content?.contact_level,
      // 담당자(작성자) 정보
      user_name: document.user?.name,
      user_level: document.user?.level,
      // 회사 정보 - DB 컬럼 우선, content fallback
      company_name: companyData?.name || document.content?.company_name,
      company_phone: companyData?.phone,
      company_fax: companyData?.fax,
      // 문서 상세 정보 - 외부 컬럼 우선, content fallback
      notes: document.notes || document.content?.notes,
      total_amount: document.total_amount ?? document.content?.total_amount,
      valid_until: document.valid_until || document.content?.valid_until,
      delivery_term: document.delivery_term || document.content?.delivery_term,
      delivery_place: document.delivery_place || document.content?.delivery_place,
      delivery_date: document.delivery_date || document.content?.delivery_date,
      delivery_date_note: document.delivery_date_note,
      payment_method: document.payment_method || document.content?.payment_method,
    };

    return NextResponse.json(formattedDocument);
  } catch (error) {
    console.error("Document fetch error:", error);
    return NextResponse.json(
      { error: "문서 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. 담당자-문서 연결 삭제
    await supabase
      .from("contacts_documents")
      .delete()
      .eq("document_id", id);

    // 2. 최종적으로 문서 삭제
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "문서가 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json(
      { error: "문서 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
