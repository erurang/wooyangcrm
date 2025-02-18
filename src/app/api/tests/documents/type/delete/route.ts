import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json(
      { error: "documentId가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    await supabase
      .from("contacts_documents")
      .delete()
      .eq("document_id", documentId);
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (error) throw error;

    return NextResponse.json({ message: "문서 삭제 완료" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "문서 삭제 중 오류 발생" },
      { status: 500 }
    );
  }
}
