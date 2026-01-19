import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// 알림 생성 함수
async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId: string,
  relatedType: string
) {
  try {
    const { error } = await supabase
      .from("notifications")
      .insert([{
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId,
        related_type: relatedType,
        read: false,
      }]);

    if (error) {
      console.error("알림 생성 실패:", error);
    }
  } catch (e) {
    console.error("알림 생성 예외:", e);
  }
}

// 상태 한글 변환
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "대기",
    completed: "완료",
    canceled: "취소",
    expired: "만료",
  };
  return statusMap[status] || status;
}

export async function PATCH(request: Request) {
  try {
    const { id, status, status_reason, updated_by } = await request.json();

    if (!id || !status || !status_reason) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // 기존 문서 정보 조회 (알림 전송용) - 거래처 정보도 포함
    const { data: document } = await supabase
      .from("documents")
      .select(`
        user_id,
        document_number,
        type,
        status,
        company:companies(name)
      `)
      .eq("id", id)
      .single();

    const oldStatus = document?.status;
    const companyName = (document?.company as { name?: string })?.name || "거래처";

    // status_reason 데이터 정제: amount 필드가 없거나 빈 문자열이면 0으로 설정
    const sanitizedStatusReason: Record<string, { reason: string; amount: number }> = {};

    for (const key in status_reason) {
      if (status_reason[key]) {
        sanitizedStatusReason[key] = {
          reason: status_reason[key].reason || "",
          amount: status_reason[key].amount !== undefined && status_reason[key].amount !== ""
            ? status_reason[key].amount
            : 0
        };
      }
    }

    const { error } = await supabase
      .from("documents")
      .update({ status, status_reason: sanitizedStatusReason }) // ✅ 정제된 데이터 저장
      .eq("id", id);

    if (error) throw error;

    // 문서 작성자에게 상태 변경 알림 전송 (상태가 실제로 변경된 경우만)
    if (document && document.user_id && oldStatus !== status) {
      const typeLabel = document.type === "estimate" ? "견적서" :
                        document.type === "order" ? "발주서" : "문서";

      // 상태를 변경한 사람이 문서 작성자 본인이 아닌 경우에만 기본 상태 변경 알림
      if (!updated_by || updated_by !== document.user_id) {
        await createNotification(
          document.user_id,
          "system",
          "문서 상태 변경",
          `${typeLabel} "${document.document_number}"의 상태가 ${getStatusLabel(oldStatus)} → ${getStatusLabel(status)}로 변경되었습니다.`,
          id,
          "document"
        );
      }

      // 견적서 완료 시 → 출고 리스트 등록 알림 (문서 작성자에게)
      if (document.type === "estimate" && status === "completed") {
        await createNotification(
          document.user_id,
          "estimate_completed",
          "견적서 완료 - 출고 등록",
          `견적서 "${document.document_number}" (${companyName})가 완료되어 출고 리스트에 등록되었습니다.\n• 거래처: ${companyName}\n• 문서번호: ${document.document_number}`,
          id,
          "document"
        );
      }

      // 발주서 완료 시 → 입고 리스트 등록 알림 (문서 작성자에게)
      if (document.type === "order" && status === "completed") {
        await createNotification(
          document.user_id,
          "order_completed",
          "발주서 완료 - 입고 등록",
          `발주서 "${document.document_number}" (${companyName})가 완료되어 입고 리스트에 등록되었습니다.\n• 거래처: ${companyName}\n• 문서번호: ${document.document_number}`,
          id,
          "document"
        );
      }
    }

    return NextResponse.json(
      { message: "Document status updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update document status", details: error },
      { status: 500 }
    );
  }
}
