import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// PATCH 요청: 담당자 내용 업데이트
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // URL 파라미터에서 담당자 ID 추출
  const body = await req.json(); // 요청에서 수정할 데이터 추출

  // 담당자 데이터를 업데이트
  const { data, error } = await supabase
    .from("contacts")
    .update(body) // body의 데이터를 업데이트
    .eq("id", id); // 특정 ID의 데이터만 업데이트

  if (error) {
    // 에러 발생 시 에러 메시지 반환
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 성공적으로 업데이트된 데이터 반환
  return NextResponse.json(data, { status: 200 });
}

// DELETE 요청: 담당자 내용 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. 담당자-상담 연결 삭제
    await supabase
      .from("contacts_consultations")
      .delete()
      .eq("contact_id", id);

    // 2. 담당자-문서 연결 삭제
    await supabase
      .from("contacts_documents")
      .delete()
      .eq("contact_id", id);

    // 3. 최종적으로 담당자 삭제
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "담당자 및 관련 데이터가 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact delete error:", error);
    return NextResponse.json(
      { error: "담당자 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
