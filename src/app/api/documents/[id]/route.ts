import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

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
