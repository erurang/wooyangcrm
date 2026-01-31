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

  console.log("[PATCH consultation] id:", id);
  console.log("[PATCH consultation] body:", JSON.stringify(body, null, 2));

  // contact_id는 별도 테이블에서 처리, user_id는 FK 제약조건용으로 추출
  const { contact_id, user_id, ...consultationData } = body;

  // user_id는 consultationData에도 포함시켜야 함
  if (user_id) {
    consultationData.user_id = user_id;
  }

  console.log("[PATCH consultation] contact_id:", contact_id, "type:", typeof contact_id);
  console.log("[PATCH consultation] user_id:", user_id);

  // 상담 데이터를 업데이트
  const { data, error } = await supabase
    .from("consultations")
    .update(consultationData) // contact_id 제외한 데이터를 업데이트
    .eq("id", id); // 특정 ID의 데이터만 업데이트

  if (error) {
    // 에러 발생 시 에러 메시지 반환
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // contact_id가 있으면 contacts_consultations 테이블 업데이트
  if (contact_id !== undefined) {
    console.log("[PATCH consultation] Processing contact_id:", contact_id);

    // 기존 연결 삭제
    const { error: deleteError, count: deleteCount } = await supabase
      .from("contacts_consultations")
      .delete()
      .eq("consultation_id", id);

    console.log("[PATCH consultation] Delete result - count:", deleteCount, "error:", deleteError?.message);

    // 새로운 연결 추가 (contact_id가 유효한 경우만)
    if (contact_id && typeof contact_id === 'string' && contact_id.trim() !== "") {
      console.log("[PATCH consultation] Inserting new contact link:", { consultation_id: id, contact_id, user_id });

      const { data: insertData, error: insertError } = await supabase
        .from("contacts_consultations")
        .insert([{
          consultation_id: id,
          contact_id,
          user_id: user_id || null, // user_id를 명시적으로 전달 (FK 제약조건)
        }])
        .select();

      console.log("[PATCH consultation] Insert result - data:", insertData, "error:", insertError?.message);

      if (insertError) {
        console.error("담당자 연결 추가 실패:", insertError.message);
      }
    } else {
      console.log("[PATCH consultation] Skipping insert - contact_id is empty/null:", contact_id);
    }
  } else {
    console.log("[PATCH consultation] contact_id is undefined, skipping contact processing");
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
