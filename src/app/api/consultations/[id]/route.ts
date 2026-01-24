import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { logConsultationOperation, logUserActivity } from "@/lib/apiLogger";

// PATCH 요청: 상담 내용 업데이트
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // URL 파라미터에서 상담 ID 추출
  const body = await req.json(); // 요청에서 수정할 데이터 추출

  // 상담 데이터를 업데이트
  const { data, error } = await supabase
    .from("consultations")
    .update(body) // body의 데이터를 업데이트
    .eq("id", id); // 특정 ID의 데이터만 업데이트

  if (error) {
    // 에러 발생 시 에러 메시지 반환
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 성공적으로 업데이트된 데이터 반환
  return NextResponse.json(data, { status: 200 });
}

// DELETE 요청: 상담 내용 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    // 삭제 전 기존 데이터 조회 (로깅용)
    const { data: oldData } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", id)
      .single();

    // 1. 상담 관련 파일 삭제
    await supabase
      .from("consultation_files")
      .delete()
      .eq("consultation_id", id);

    // 2. 상담-담당자 연결 삭제
    await supabase
      .from("contacts_consultations")
      .delete()
      .eq("consultation_id", id);

    // 3. 상담 관련 문서의 담당자-문서 연결 먼저 조회 및 삭제
    const { data: docs } = await supabase
      .from("documents")
      .select("id")
      .eq("consultation_id", id);

    const docIds = docs?.map((d) => d.id) || [];

    if (docIds.length > 0) {
      await supabase
        .from("contacts_documents")
        .delete()
        .in("document_id", docIds);
    }

    // 4. 상담 관련 문서 삭제
    await supabase
      .from("documents")
      .delete()
      .eq("consultation_id", id);

    // 5. 최종적으로 상담 삭제
    const { error } = await supabase
      .from("consultations")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 감사 로그 기록
    if (userId && oldData) {
      await logConsultationOperation("DELETE", id, oldData, null, userId);
      await logUserActivity({
        userId,
        action: "상담 삭제",
        actionType: "crud",
        targetType: "consultation",
        targetId: id,
        targetName: oldData.title || oldData.content?.substring(0, 50) || id,
      });
    }

    return NextResponse.json(
      { message: "상담 및 관련 데이터가 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Consultation delete error:", error);
    return NextResponse.json(
      { error: "상담 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
