import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // context.params에서 회사 ID 추출

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id) // 특정 ID에 해당하는 회사 검색
    .single(); // 단일 결과 반환

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ company: data }, { status: 200 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // context.params에서 회사 ID 추출
  const body = await req.json(); // 요청에서 수정할 데이터 추출

  if (!body || Object.keys(body).length === 0) {
    return NextResponse.json(
      { error: "수정할 데이터가 없습니다." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("companies")
    .update(body) // body의 데이터를 업데이트
    .eq("id", id); // 특정 ID의 회사만 업데이트

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { message: "Company updated successfully", data },
    { status: 200 }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. 해당 회사의 상담 ID 목록 조회
    const { data: consultations } = await supabase
      .from("consultations")
      .select("id")
      .eq("company_id", id);

    const consultationIds = consultations?.map((c) => c.id) || [];

    if (consultationIds.length > 0) {
      // 2. 상담 관련 파일 삭제
      await supabase
        .from("consultation_files")
        .delete()
        .in("consultation_id", consultationIds);

      // 3. 상담-담당자 연결 삭제
      await supabase
        .from("contacts_consultations")
        .delete()
        .in("consultation_id", consultationIds);

      // 4. 상담 관련 문서 삭제
      await supabase
        .from("documents")
        .delete()
        .in("consultation_id", consultationIds);

      // 5. 상담 삭제
      await supabase
        .from("consultations")
        .delete()
        .eq("company_id", id);
    }

    // 6. 회사 직접 연결된 문서 삭제
    await supabase
      .from("documents")
      .delete()
      .eq("company_id", id);

    // 7. 해당 회사의 담당자 ID 목록 조회
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id")
      .eq("company_id", id);

    const contactIds = contacts?.map((c) => c.id) || [];

    if (contactIds.length > 0) {
      // 8. 담당자-문서 연결 삭제
      await supabase
        .from("contacts_documents")
        .delete()
        .in("contact_id", contactIds);

      // 9. 담당자-상담 연결 삭제 (이미 위에서 처리되었을 수 있지만 안전하게)
      await supabase
        .from("contacts_consultations")
        .delete()
        .in("contact_id", contactIds);

      // 10. 담당자 삭제
      await supabase
        .from("contacts")
        .delete()
        .eq("company_id", id);
    }

    // 11. 즐겨찾기 삭제
    await supabase
      .from("favorites")
      .delete()
      .eq("item_id", id);

    // 12. 최종적으로 회사 삭제
    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "회사 및 관련 데이터가 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Company delete error:", error);
    return NextResponse.json(
      { error: "회사 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
