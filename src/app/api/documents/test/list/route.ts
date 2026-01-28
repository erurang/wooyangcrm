import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/documents/test/list
 * 재고연동 문서 목록 조회 (document_items 테이블 사용하는 문서)
 * content._v2 = true 인 문서들
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const consultationId = searchParams.get("consultationId");
  const type = searchParams.get("type"); // optional: estimate 또는 order

  if (!consultationId) {
    return NextResponse.json(
      { error: "consultationId가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // content._v2 = true 인 문서 조회
    // PostgREST에서 JSONB 필드 조회 시 contains 사용
    let query = supabase
      .from("documents")
      .select("id, document_number, type, date, total_amount, status, created_at, content")
      .eq("consultation_id", consultationId)
      .contains("content", { _v2: true })
      .order("created_at", { ascending: false });

    // type 필터 (옵션)
    if (type) {
      query = query.eq("type", type);
    }

    const { data: documents, error } = await query;

    if (error) throw error;

    // 각 문서의 items 수 조회
    const documentsWithItemsCount = await Promise.all(
      (documents || []).map(async (doc) => {
        const { count } = await supabase
          .from("document_items")
          .select("id", { count: "exact", head: true })
          .eq("document_id", doc.id);

        return {
          ...doc,
          items_count: count || 0,
          content: undefined, // content는 응답에서 제외
        };
      })
    );

    return NextResponse.json({
      documents: documentsWithItemsCount,
    });
  } catch (error) {
    console.error("Error fetching linked documents:", error);
    return NextResponse.json(
      { error: "문서 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
