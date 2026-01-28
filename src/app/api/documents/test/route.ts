import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface DocumentItemInput {
  product_id?: string;
  name: string;
  spec?: string;
  internal_name?: string;
  internal_spec?: string;
  quantity: string | number;
  unit?: string;
  unit_price: number;
  amount: number;
  original_unit_price?: number;
}

/**
 * 단가 변경 시 이력 기록 및 별칭 업데이트
 */
async function trackPriceChanges(
  items: DocumentItemInput[],
  companyId: string,
  documentId: string,
  documentType: string,
  documentDate: string
) {
  const priceType = documentType === "order" ? "purchase" : "sales";

  for (const item of items) {
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

        // 2. 별칭 단가 업데이트
        await supabase
          .from("company_product_aliases")
          .update({
            external_unit_price: item.unit_price,
            last_used_at: new Date().toISOString()
          })
          .eq("product_id", item.product_id)
          .eq("company_id", companyId)
          .eq("alias_type", priceType);

        console.log(
          `[PriceTrack] ${item.name}: ${item.original_unit_price} → ${item.unit_price}`
        );
      } catch (error) {
        console.error("[PriceTrack] Error:", error);
      }
    }
  }
}

/**
 * 별칭 사용 카운트 업데이트
 */
async function updateAliasUsage(
  items: DocumentItemInput[],
  companyId: string,
  documentType: string
) {
  const aliasType = documentType === "order" ? "purchase" : "sales";

  for (const item of items) {
    if (item.product_id) {
      try {
        // use_count 증가 및 last_used_at 업데이트
        await supabase.rpc("increment_alias_use_count", {
          p_product_id: item.product_id,
          p_company_id: companyId,
          p_alias_type: aliasType,
          p_external_name: item.name
        }).then(async (res) => {
          // RPC가 없으면 직접 업데이트
          if (res.error) {
            await supabase
              .from("company_product_aliases")
              .update({
                use_count: supabase.rpc("coalesce_int", { value: 0 }),
                last_used_at: new Date().toISOString()
              })
              .eq("product_id", item.product_id!)
              .eq("company_id", companyId)
              .eq("alias_type", aliasType)
              .eq("external_name", item.name);
          }
        });
      } catch (error) {
        console.error("[AliasUsage] Error:", error);
      }
    }
  }
}

/**
 * POST /api/documents/test
 * 실험적 문서 저장 (document_items 테이블 사용)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      items,
      user_id,
      consultation_id,
      company_id,
      type, // "estimate" | "order"
      date,
      notes,
    } = body;

    // 필수 값 확인
    if (!user_id || !consultation_id || !company_id || !type) {
      return NextResponse.json(
        { error: "필수 값이 없습니다. (user_id, consultation_id, company_id, type)" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "품목이 없습니다." },
        { status: 400 }
      );
    }

    // 1. document_number 생성
    const typePrefix = type === "estimate" ? "EST" : "ORD";
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

    // 총액 계산
    const total_amount = items.reduce(
      (sum: number, item: DocumentItemInput) => sum + (item.amount || 0),
      0
    );

    // 2. documents 테이블에 문서 생성
    // content는 레거시 호환을 위해 빈 객체 또는 최소 데이터만 저장
    const { data: documentData, error: documentError } = await supabase
      .from("documents")
      .insert([
        {
          document_number,
          content: { items: [], _v2: true }, // v2 플래그로 document_items 사용 표시
          user_id,
          consultation_id,
          company_id,
          type,
          date: date || new Date().toISOString().split("T")[0],
          status: "pending",
          notes: notes || null,
          total_amount,
        },
      ])
      .select()
      .single();

    if (documentError) {
      console.error("Document insert error:", documentError);
      throw documentError;
    }

    const document_id = documentData.id;

    // 3. document_items 테이블에 품목 저장
    const documentItems = items.map((item: DocumentItemInput, index: number) => ({
      document_id,
      product_id: item.product_id || null,
      item_number: index + 1,
      name: item.name,
      spec: item.spec || null,
      internal_name: item.internal_name || null,
      internal_spec: item.internal_spec || null,
      quantity: String(item.quantity),
      unit: item.unit || null,
      unit_price: item.unit_price || 0,
      amount: item.amount || 0,
    }));

    const { error: itemsError } = await supabase
      .from("document_items")
      .insert(documentItems);

    if (itemsError) {
      console.error("Document items insert error:", itemsError);
      // 문서 삭제 (롤백)
      await supabase.from("documents").delete().eq("id", document_id);
      throw itemsError;
    }

    // 4. 단가 변동 추적
    await trackPriceChanges(
      items,
      company_id,
      document_id,
      type,
      date || new Date().toISOString().split("T")[0]
    );

    // 5. 별칭 사용 카운트 업데이트
    await updateAliasUsage(items, company_id, type);

    console.log(
      `[DocumentTest] Created document ${document_number} with ${items.length} items`
    );

    return NextResponse.json(
      {
        success: true,
        document: documentData,
        items_count: items.length,
        message: `${type === "estimate" ? "견적서" : "발주서"} 저장 완료 (document_items 사용)`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in /api/documents/test:", error);
    return NextResponse.json(
      { error: "문서 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/test/[id]
 * document_items 기반 문서 조회 (테스트용)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const documentId = searchParams.get("id");

  if (!documentId) {
    return NextResponse.json(
      { error: "문서 ID가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // 문서 조회
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*, companies(name)")
      .eq("id", documentId)
      .single();

    if (docError) throw docError;

    // document_items 조회
    const { data: items, error: itemsError } = await supabase
      .from("document_items")
      .select("*, products(internal_name, internal_code)")
      .eq("document_id", documentId)
      .order("item_number", { ascending: true });

    if (itemsError) throw itemsError;

    return NextResponse.json({
      document,
      items,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "문서 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
