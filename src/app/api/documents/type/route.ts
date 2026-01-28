import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { logDocumentOperation, logUserActivity } from "@/lib/apiLogger";

interface DocumentItem {
  product_id?: string;
  unit_price?: number;
  original_unit_price?: number;
  name?: string;
  spec?: string;
}

/**
 * 단가 변경 시 이력 기록 및 별칭 업데이트
 */
async function trackPriceChanges(
  items: DocumentItem[],
  companyId: string,
  documentId: string,
  documentType: string,
  documentDate: string
) {
  const priceType = documentType === "order" || documentType === "requestQuote" ? "purchase" : "sales";

  for (const item of items) {
    // product_id가 있고, 단가가 변경된 경우에만 처리
    if (
      item.product_id &&
      item.original_unit_price !== undefined &&
      item.unit_price !== undefined &&
      item.unit_price !== item.original_unit_price
    ) {
      try {
        // 1. 단가 이력 기록
        await supabase.from("product_price_history").insert({
          product_id: item.product_id,
          company_id: companyId,
          price_type: priceType,
          unit_price: item.unit_price,
          previous_price: item.original_unit_price,
          spec: item.spec || null,
          document_id: documentId,
          effective_date: documentDate || new Date().toISOString().split("T")[0],
        });

        // 2. 별칭 단가 업데이트 (해당 회사+제품+타입의 별칭)
        await supabase
          .from("company_product_aliases")
          .update({ external_unit_price: item.unit_price })
          .eq("product_id", item.product_id)
          .eq("company_id", companyId)
          .eq("alias_type", priceType);

        console.log(
          `[PriceTrack] ${item.name}: ${item.original_unit_price} → ${item.unit_price}`
        );
      } catch (error) {
        console.error("[PriceTrack] Error:", error);
        // 단가 추적 실패해도 문서 저장은 계속 진행
      }
    }
  }
}

/**
 * GET /api/documents/type
 * 문서 타입별 목록 조회
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const consultationId = searchParams.get("consultationId");
  const type = searchParams.get("type");

  if (!consultationId || !type) {
    return NextResponse.json(
      { error: "consultationId 또는 type이 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("documents")
      .select(
        "*, contacts_documents(contacts(contact_name,level,mobile), users(name,level)), companies(name, phone, fax)"
      )
      .eq("consultation_id", consultationId)
      .eq("type", type)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ documents: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "문서 목록을 가져오는 중 오류 발생" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/type
 * 문서 추가
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
      notes,
      valid_until,
      delivery_date,
      delivery_date_note,
      total_amount,
      delivery_term,
      delivery_place,
    } = body;

    if (!user_id || !consultation_id || !company_id || !type) {
      return NextResponse.json({ error: "필수 값이 없습니다." }, { status: 400 });
    }

    const contentData = content?.items ? { items: content.items } : { items: [] };

    // document_number 자동 생성
    const typePrefix =
      type === "estimate"
        ? "EST"
        : type === "order"
          ? "ORD"
          : type === "requestQuote"
            ? "RQ"
            : "DOC";
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

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
          notes: notes || null,
          valid_until: valid_until || null,
          delivery_date: delivery_date || null,
          delivery_date_note: delivery_date_note || null,
          total_amount: total_amount || 0,
          delivery_term: delivery_term || null,
          delivery_place: delivery_place || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const document_id = data.id;

    // 단가 변동 추적 (자동 학습)
    if (contentData.items && contentData.items.length > 0) {
      await trackPriceChanges(
        contentData.items,
        company_id,
        document_id,
        type,
        date || new Date().toISOString().split("T")[0]
      );
    }

    if (contact_id) {
      await supabase.from("contacts_documents").insert({
        document_id,
        contact_id,
        user_id,
      });
    }

    await logDocumentOperation(
      "INSERT",
      document_id,
      null,
      data as Record<string, unknown>,
      user_id
    );

    const typeLabel =
      type === "estimate" ? "견적서" : type === "order" ? "발주서" : "의뢰서";
    await logUserActivity({
      userId: user_id,
      action: `${typeLabel} 등록`,
      actionType: "crud",
      targetType: "document",
      targetId: document_id,
      targetName: document_number,
    });

    return NextResponse.json({ document: data }, { status: 201 });
  } catch (error) {
    console.error("Error adding document:", error);
    return NextResponse.json({ error: "문서 추가 중 오류 발생" }, { status: 500 });
  }
}

/**
 * PATCH /api/documents/type
 * 문서 수정
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      document_id,
      content,
      payment_method,
      contact_id,
      date,
      user_id,
      notes,
      valid_until,
      delivery_date,
      delivery_date_note,
      total_amount,
      delivery_term,
      delivery_place,
    } = body;

    if (!document_id) {
      return NextResponse.json({ error: "문서 ID가 필요합니다." }, { status: 400 });
    }

    const { data: oldDocument } = await supabase
      .from("documents")
      .select("*, type, document_number")
      .eq("id", document_id)
      .single();

    const contentData = content?.items ? { items: content.items } : { items: [] };

    const { data, error } = await supabase
      .from("documents")
      .update({
        content: contentData,
        payment_method,
        date,
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

    // 단가 변동 추적 (자동 학습)
    if (contentData.items && contentData.items.length > 0 && oldDocument?.company_id) {
      await trackPriceChanges(
        contentData.items,
        oldDocument.company_id,
        document_id,
        oldDocument.type,
        date || oldDocument.date || new Date().toISOString().split("T")[0]
      );
    }

    if (contact_id) {
      await supabase
        .from("contacts_documents")
        .update({ contact_id })
        .eq("document_id", document_id);
    }

    if (user_id) {
      await logDocumentOperation(
        "UPDATE",
        document_id,
        oldDocument as Record<string, unknown>,
        data as Record<string, unknown>,
        user_id
      );

      const docType = oldDocument?.type || "document";
      const typeLabel =
        docType === "estimate" ? "견적서" : docType === "order" ? "발주서" : "의뢰서";
      await logUserActivity({
        userId: user_id,
        action: `${typeLabel} 수정`,
        actionType: "crud",
        targetType: "document",
        targetId: document_id,
        targetName: oldDocument?.document_number || document_id,
      });
    }

    return NextResponse.json({ document: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "문서 수정 중 오류 발생" }, { status: 500 });
  }
}
