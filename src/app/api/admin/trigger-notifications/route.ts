import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface NotificationData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_id: string;
  related_type: string;
}

// 알림 생성 (중복 방지)
async function createNotificationIfNotExists(data: NotificationData) {
  const today = new Date().toISOString().split("T")[0];

  // 오늘 이미 같은 알림이 있는지 확인
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", data.user_id)
    .eq("type", data.type)
    .eq("related_id", data.related_id)
    .gte("created_at", `${today}T00:00:00`)
    .maybeSingle();

  if (existing) {
    console.log(`Skipping duplicate notification for ${data.related_id}`);
    return false;
  }

  const { error } = await supabase.from("notifications").insert([{
    ...data,
    read: false,
  }]);

  if (error) {
    console.error("알림 생성 실패:", error);
    return false;
  }

  console.log(`알림 생성 완료: ${data.title} - ${data.message}`);
  return true;
}

// 1. 문서 만료 알림 (D-3, D-1)
async function checkDocumentExpiry() {
  const results = { d3: 0, d1: 0 };

  const today = new Date();
  const d1 = new Date(today);
  d1.setDate(d1.getDate() + 1);
  const d3 = new Date(today);
  d3.setDate(d3.getDate() + 3);

  const d1Str = d1.toISOString().split("T")[0];
  const d3Str = d3.toISOString().split("T")[0];

  // D-3 만료 예정 문서
  const { data: d3Documents } = await supabase
    .from("documents")
    .select("id, document_number, type, user_id, valid_until")
    .eq("status", "pending")
    .eq("valid_until", d3Str);

  for (const doc of d3Documents || []) {
    const typeLabel = doc.type === "estimate" ? "견적서" : doc.type === "order" ? "발주서" : "문서";
    const created = await createNotificationIfNotExists({
      user_id: doc.user_id,
      type: "document_expiry",
      title: "문서 만료 예정 (D-3)",
      message: `${typeLabel} "${doc.document_number}"가 3일 후(${doc.valid_until}) 만료됩니다.`,
      related_id: doc.id,
      related_type: "document",
    });
    if (created) results.d3++;
  }

  // D-1 만료 예정 문서
  const { data: d1Documents } = await supabase
    .from("documents")
    .select("id, document_number, type, user_id, valid_until")
    .eq("status", "pending")
    .eq("valid_until", d1Str);

  for (const doc of d1Documents || []) {
    const typeLabel = doc.type === "estimate" ? "견적서" : doc.type === "order" ? "발주서" : "문서";
    const created = await createNotificationIfNotExists({
      user_id: doc.user_id,
      type: "document_expiry",
      title: "문서 만료 임박 (D-1)",
      message: `${typeLabel} "${doc.document_number}"가 내일(${doc.valid_until}) 만료됩니다!`,
      related_id: doc.id,
      related_type: "document",
    });
    if (created) results.d1++;
  }

  return results;
}

// 2. 상담 후속조치 알림 (당일)
async function checkConsultationFollowUp() {
  let count = 0;
  const today = new Date().toISOString().split("T")[0];

  const { data: consultations } = await supabase
    .from("consultations")
    .select(`
      id,
      user_id,
      follow_up_date,
      content,
      companies(name)
    `)
    .eq("follow_up_date", today);

  for (const consultation of consultations || []) {
    const companyName = (consultation.companies as { name?: string } | null)?.name || "거래처";
    const contentPreview = consultation.content?.substring(0, 30) + (consultation.content?.length > 30 ? "..." : "");

    const created = await createNotificationIfNotExists({
      user_id: consultation.user_id,
      type: "consultation_followup",
      title: "오늘 후속조치 예정",
      message: `"${companyName}" 상담의 후속조치일입니다. (${contentPreview})`,
      related_id: consultation.id,
      related_type: "consultation",
    });
    if (created) count++;
  }

  return count;
}

// 3. 할일 마감 알림 (당일, D-1)
async function checkTodoReminders() {
  const results = { today: 0, tomorrow: 0 };

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // 오늘 마감 할일
  const { data: todayTodos } = await supabase
    .from("todos")
    .select("id, user_id, content, due_date")
    .eq("is_completed", false)
    .eq("due_date", todayStr);

  for (const todo of todayTodos || []) {
    const created = await createNotificationIfNotExists({
      user_id: todo.user_id,
      type: "todo_reminder",
      title: "오늘 마감 할일",
      message: `"${todo.content}" 할일이 오늘 마감입니다!`,
      related_id: todo.id,
      related_type: "todo",
    });
    if (created) results.today++;
  }

  // 내일 마감 할일
  const { data: tomorrowTodos } = await supabase
    .from("todos")
    .select("id, user_id, content, due_date")
    .eq("is_completed", false)
    .eq("due_date", tomorrowStr);

  for (const todo of tomorrowTodos || []) {
    const created = await createNotificationIfNotExists({
      user_id: todo.user_id,
      type: "todo_reminder",
      title: "내일 마감 할일",
      message: `"${todo.content}" 할일이 내일 마감됩니다.`,
      related_id: todo.id,
      related_type: "todo",
    });
    if (created) results.tomorrow++;
  }

  return results;
}

// POST: 수동으로 스케줄 알림 트리거 (관리자용)
export async function POST() {
  try {
    console.log("=== 스케줄 알림 수동 실행 시작 ===");

    const documentResults = await checkDocumentExpiry();
    const consultationCount = await checkConsultationFollowUp();
    const todoResults = await checkTodoReminders();

    console.log("=== 스케줄 알림 수동 실행 완료 ===");

    return NextResponse.json({
      success: true,
      message: "스케줄 알림 처리 완료",
      results: {
        documents: {
          d3_expiry: documentResults.d3,
          d1_expiry: documentResults.d1,
        },
        consultations: {
          follow_up: consultationCount,
        },
        todos: {
          today_due: todoResults.today,
          tomorrow_due: todoResults.tomorrow,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("스케줄 알림 오류:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// GET: Vercel Cron 또는 수동 트리거
export async function GET(request: Request) {
  // Vercel Cron 인증 확인 (선택적)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET이 설정된 경우에만 인증 확인
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // 브라우저 직접 접근 시 정보만 반환
    if (!authHeader) {
      return NextResponse.json({
        endpoint: "/api/admin/trigger-notifications",
        description: "스케줄 알림 수동 트리거 (문서 만료, 상담 후속조치, 할일 마감)",
        method: "GET or POST",
        note: "CRON_SECRET 환경변수가 설정된 경우 Authorization 헤더 필요",
      });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 알림 실행
  try {
    console.log("=== 스케줄 알림 (Cron) 실행 시작 ===");

    const documentResults = await checkDocumentExpiry();
    const consultationCount = await checkConsultationFollowUp();
    const todoResults = await checkTodoReminders();

    console.log("=== 스케줄 알림 (Cron) 실행 완료 ===");

    return NextResponse.json({
      success: true,
      message: "스케줄 알림 처리 완료",
      results: {
        documents: {
          d3_expiry: documentResults.d3,
          d1_expiry: documentResults.d1,
        },
        consultations: {
          follow_up: consultationCount,
        },
        todos: {
          today_due: todoResults.today,
          tomorrow_due: todoResults.tomorrow,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("스케줄 알림 오류:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
