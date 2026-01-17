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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { consultation_id, content, follow_up_date, user_id, contact_id, updated_by, title, contact_method } = body;

    if (!consultation_id || !content || !user_id || !contact_id) {
      return NextResponse.json(
        { error: "필수 값이 없습니다." },
        { status: 400 }
      );
    }

    // 기존 상담 정보 조회 (알림 전송용)
    const { data: oldConsultation } = await supabase
      .from("consultations")
      .select("user_id, follow_up_date, company_id, companies(name)")
      .eq("id", consultation_id)
      .single();

    const oldUserId = oldConsultation?.user_id;
    const oldFollowUpDate = oldConsultation?.follow_up_date;
    const companyName = (oldConsultation?.companies as { name?: string } | null)?.name || "거래처";

    // 🔹 상담-담당자 업데이트
    const { error: contactUpdateError } = await supabase
      .from("contacts_consultations")
      .update({ contact_id })
      .eq("consultation_id", consultation_id);

    if (contactUpdateError) {
      console.error("[ConsultationUpdate] Contact update error:", contactUpdateError);
      return NextResponse.json(
        { error: "담당자 업데이트 실패", details: contactUpdateError.message },
        { status: 500 }
      );
    }

    // 🔹 상담 내역 업데이트 (follow_up_date가 빈 문자열이면 null로 설정)
    const updateData: Record<string, unknown> = { content, user_id };
    const newFollowUpDate = follow_up_date && follow_up_date.trim() !== "" ? follow_up_date : null;
    updateData.follow_up_date = newFollowUpDate;

    // title과 contact_method 추가
    if (title !== undefined) {
      updateData.title = title || null;
    }
    if (contact_method !== undefined) {
      updateData.contact_method = contact_method || "email";
    }

    const { error: consultationUpdateError } = await supabase
      .from("consultations")
      .update(updateData)
      .eq("id", consultation_id);

    if (consultationUpdateError) {
      console.error("[ConsultationUpdate] Consultation update error:", consultationUpdateError);
      return NextResponse.json(
        { error: "상담 내역 수정 실패", details: consultationUpdateError.message },
        { status: 500 }
      );
    }

    // 🔹 알림 전송
    // 1. 담당자가 변경된 경우 - 새 담당자에게 알림
    if (oldUserId && user_id !== oldUserId) {
      // 변경한 사람 정보 조회
      let updaterName = "누군가";
      if (updated_by) {
        const { data: updater } = await supabase
          .from("users")
          .select("name")
          .eq("id", updated_by)
          .single();
        updaterName = updater?.name || "누군가";
      }

      await createNotification(
        user_id,
        "consultation_followup",
        "상담 배정",
        `${updaterName}님이 "${companyName}" 상담을 회원님에게 배정했습니다.`,
        consultation_id,
        "consultation"
      );
    }

    // 2. 후속조치 날짜가 새로 설정된 경우 - 담당자에게 알림 (본인이 설정한 경우 제외)
    if (newFollowUpDate && newFollowUpDate !== oldFollowUpDate) {
      // 변경한 사람이 담당자 본인이 아닌 경우에만 알림
      if (updated_by && updated_by !== user_id) {
        const { data: updater } = await supabase
          .from("users")
          .select("name")
          .eq("id", updated_by)
          .single();

        await createNotification(
          user_id,
          "consultation_followup",
          "후속조치 날짜 설정",
          `${updater?.name || "누군가"}님이 "${companyName}" 상담의 후속조치 날짜를 ${newFollowUpDate}로 설정했습니다.`,
          consultation_id,
          "consultation"
        );
      }
    }

    return NextResponse.json(
      { message: "상담 내역 수정 완료" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
