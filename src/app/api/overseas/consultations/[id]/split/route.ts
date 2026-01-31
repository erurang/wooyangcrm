import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: 분할 배송 생성
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parentId } = await params;
    const body = await request.json();

    // 원본 상담 조회
    const { data: parentConsultation, error: parentError } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", parentId)
      .single();

    if (parentError || !parentConsultation) {
      return NextResponse.json(
        { error: "원본 상담을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 기존 분할 배송 수 조회
    const { count: existingSplits } = await supabase
      .from("consultations")
      .select("*", { count: "exact", head: true })
      .eq("parent_consultation_id", parentId);

    const nextSplitNumber = (existingSplits || 0) + 1;

    // O/C No. 생성: 원본-분할번호
    const baseOcNumber = parentConsultation.oc_number || `SPLIT-${parentId.slice(0, 8)}`;
    const newOcNumber = `${baseOcNumber}-${nextSplitNumber}`;

    // 분할 배송 생성 (원본에서 기본 정보 복사)
    const { data: newSplit, error: createError } = await supabase
      .from("consultations")
      .insert({
        company_id: parentConsultation.company_id,
        is_overseas: true,
        date: new Date().toISOString().split("T")[0],
        content: body.content || `분할 배송 #${nextSplitNumber}`,
        title: body.title || `${parentConsultation.title || "분할 배송"} - ${nextSplitNumber}`,
        user_id: body.user_id || parentConsultation.user_id,
        order_type: body.order_type || parentConsultation.order_type,
        oc_number: newOcNumber,
        product_name: body.product_name || parentConsultation.product_name,
        specification: body.specification || parentConsultation.specification,
        quantity: body.quantity || "",
        currency: body.currency || parentConsultation.currency,
        shipping_method: body.shipping_method || "air",
        shipping_carrier_id: body.shipping_carrier_id || null,
        incoterms: body.incoterms || parentConsultation.incoterms,
        trade_status: body.trade_status || "ordered",
        parent_consultation_id: parentId,
        split_number: nextSplitNumber,
        remarks: body.remarks || "",
      })
      .select()
      .single();

    if (createError) {
      console.error("분할 배송 생성 오류:", createError);
      return NextResponse.json(
        { error: `분할 배송 생성 실패: ${createError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "분할 배송이 생성되었습니다.",
      consultation: newSplit,
      split_number: nextSplitNumber,
    });
  } catch (error) {
    console.error("분할 배송 생성 오류:", error);
    return NextResponse.json(
      { error: "분할 배송 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// GET: 분할 배송 목록 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parentId } = await params;

    const { data: splits, error } = await supabase
      .from("consultations")
      .select(`
        *,
        shipping_carrier:shipping_carrier_id (
          id,
          name,
          code
        )
      `)
      .eq("parent_consultation_id", parentId)
      .order("split_number", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      splits: splits || [],
      total: splits?.length || 0,
    });
  } catch (error) {
    console.error("분할 배송 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "분할 배송 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
