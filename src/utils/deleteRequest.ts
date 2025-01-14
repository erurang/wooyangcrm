import { supabase } from "@/lib/supabaseClient";

interface User {
  email: string;
}

export const handleDeleteRequest = async (
  user: User | null,
  documentId: string,
  documentType: string
) => {
  if (!user?.email) {
    alert("로그인이 필요합니다.");
    return;
  }

  const reason = prompt("삭제 사유를 입력하세요:");
  if (!reason) {
    alert("삭제가 취소되었습니다.");
    return;
  }

  try {
    // 요청 삽입 시 document_type에 따라 올바른 필드 설정
    const payload: Record<string, any> = {
      requested_by: user.email,
      reason,
      document_type: documentType,
    };

    if (documentType === "company") {
      payload.company_id = documentId; // 회사 삭제 요청
    } else {
      payload.document_id = documentId; // 다른 문서 삭제 요청
    }

    const { error } = await supabase.from("delete_requests").insert(payload);

    if (error) {
      console.error("삭제 요청 실패:", error);
      alert("삭제 요청에 실패했습니다.");
      return;
    }

    alert("삭제 요청이 완료되었습니다. 관리자의 승인을 기다려주세요.");
  } catch (err) {
    console.error("삭제 요청 중 에러:", err);
  }
};
