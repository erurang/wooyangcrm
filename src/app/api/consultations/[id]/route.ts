import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

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
  const { id } = await params; // URL 파라미터에서 상담 ID 추출

  // 상담 데이터를 삭제
  const { data, error } = await supabase
    .from("consultations")
    .delete() // 데이터 삭제
    .eq("id", id); // 특정 ID의 데이터만 삭제

  if (error) {
    // 에러 발생 시 에러 메시지 반환
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 성공적으로 삭제된 데이터 반환
  return NextResponse.json(
    { message: "Consultation deleted successfully.", data },
    { status: 200 }
  );
}
