import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { logDocumentOperation, logUserActivity } from "@/lib/apiLogger";

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");
  const userId = searchParams.get("userId");

  if (!documentId) {
    return NextResponse.json(
      { error: "documentId가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // 삭제 전 문서 정보 조회 (로깅용)
    const { data: oldDocument } = await supabase
      .from("documents")
      .select("*, type, document_number")
      .eq("id", documentId)
      .single();

    // 관련 테이블 먼저 삭제 (FK 제약 때문)
    await supabase
      .from("contacts_documents")
      .delete()
      .eq("document_id", documentId);

    // document_items 삭제 (v2 문서용)
    await supabase
      .from("document_items")
      .delete()
      .eq("document_id", documentId);

    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (error) throw error;

    // 감사 로그 및 활동 로그 기록
    if (userId && oldDocument) {
      await logDocumentOperation(
        "DELETE",
        documentId,
        oldDocument as Record<string, unknown>,
        null,
        userId
      );

      const docType = oldDocument.type || "document";
      const typeLabel = docType === "estimate" ? "견적서" : docType === "order" ? "발주서" : "의뢰서";
      await logUserActivity({
        userId,
        action: `${typeLabel} 삭제`,
        actionType: "crud",
        targetType: "document",
        targetId: documentId,
        targetName: oldDocument.document_number || documentId,
      });
    }

    return NextResponse.json({ message: "문서 삭제 완료" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "문서 삭제 중 오류 발생" },
      { status: 500 }
    );
  }
}
