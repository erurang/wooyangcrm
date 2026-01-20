import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// VAPID 설정 (동적으로 web-push 로드)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@wooyang.com";

// web-push 인스턴스를 lazy하게 가져오기
let webPushInstance: typeof import("web-push") | null = null;

async function getWebPush() {
  if (!vapidPublicKey || !vapidPrivateKey) {
    return null;
  }
  if (!webPushInstance) {
    try {
      webPushInstance = await import("web-push");
      webPushInstance.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    } catch (e) {
      console.error("web-push 로드 실패:", e);
      return null;
    }
  }
  return webPushInstance;
}

/**
 * PWA 푸시 발송
 */
async function sendPushToUser(userId: string, title: string, body: string, url: string, tag: string, notificationId?: number) {
  const webPush = await getWebPush();
  if (!webPush) return;

  try {
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (!subscriptions || subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title,
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      url,
      tag,
      notificationId,
    });

    for (const sub of subscriptions) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );
      } catch (err: unknown) {
        const error = err as { statusCode?: number };
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }
  } catch (e) {
    console.error("푸시 발송 오류:", e);
  }
}

// GET: 단일 재고 작업 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("inventory_tasks")
      .select(
        `
        *,
        document:documents!inventory_tasks_document_id_fkey (
          id, document_number, type, date, content, delivery_date, valid_until, total_amount, user_id
        ),
        company:companies!inventory_tasks_company_id_fkey (
          id, name
        ),
        assignee:users!inventory_tasks_assigned_to_fkey (
          id, name, level
        ),
        assigner:users!inventory_tasks_assigned_by_fkey (
          id, name, level
        ),
        completer:users!inventory_tasks_completed_by_fkey (
          id, name, level
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "재고 작업을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ task: data });
  } catch (error) {
    console.error("재고 작업 조회 에러:", error);
    return NextResponse.json(
      { error: "재고 작업 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 사용자 이름 조회 헬퍼
async function getUserName(userId: string): Promise<string> {
  const { data } = await supabase
    .from("users")
    .select("name")
    .eq("id", userId)
    .single();
  return data?.name || "사용자";
}

// 거래처 이름 조회 헬퍼
async function getCompanyName(companyId: string): Promise<string> {
  const { data } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .single();
  return data?.name || "거래처";
}

// PATCH: 재고 작업 수정 (예정일, 메모, 상태 등)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { expected_date, notes, status, assigned_to, user_id, cancel_reason } = body;

    // 기존 데이터 조회
    const { data: oldData, error: fetchError } = await supabase
      .from("inventory_tasks")
      .select("*, assignee:users!inventory_tasks_assigned_to_fkey(id, name)")
      .eq("id", id)
      .single();

    if (fetchError || !oldData) {
      return NextResponse.json(
        { error: "재고 작업을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {};
    const changedFields: string[] = [];

    if (expected_date !== undefined && expected_date !== oldData.expected_date) {
      updateData.expected_date = expected_date;
      changedFields.push("expected_date");
    }

    if (notes !== undefined && notes !== oldData.notes) {
      updateData.notes = notes;
      changedFields.push("notes");
    }

    if (status !== undefined && status !== oldData.status) {
      updateData.status = status;
      changedFields.push("status");

      // 완료 처리 시 completed_by, completed_at 설정
      if (status === "completed" && user_id) {
        updateData.completed_by = user_id;
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (assigned_to !== undefined && assigned_to !== oldData.assigned_to) {
      updateData.assigned_to = assigned_to;
      updateData.assigned_by = user_id;
      updateData.assigned_at = new Date().toISOString();
      updateData.status = "assigned";
      changedFields.push("assigned_to");
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "변경 사항이 없습니다", task: oldData });
    }

    // 업데이트
    const { data, error } = await supabase
      .from("inventory_tasks")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        document:documents!inventory_tasks_document_id_fkey (
          id, document_number, type, date, content, delivery_date, valid_until, total_amount
        ),
        company:companies!inventory_tasks_company_id_fkey (
          id, name
        ),
        assignee:users!inventory_tasks_assigned_to_fkey (
          id, name, level
        ),
        assigner:users!inventory_tasks_assigned_by_fkey (
          id, name, level
        ),
        completer:users!inventory_tasks_completed_by_fkey (
          id, name, level
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`재고 작업 수정 실패: ${error.message}`);
    }

    // 로그 기록
    await supabase.from("logs").insert({
      table_name: "inventory_tasks",
      operation: "UPDATE",
      record_id: id,
      old_data: oldData,
      new_data: data,
      changed_by: user_id || null,
    });

    // 작업 타입 텍스트 및 알림 타입 결정
    const isInbound = oldData.task_type === "inbound";
    const taskTypeText = isInbound ? "입고" : "출고";
    const companyName = oldData.company_id ? await getCompanyName(oldData.company_id) : "거래처";
    const changerName = user_id ? await getUserName(user_id) : "사용자";

    // 재고 탭 URL
    const inventoryUrl = isInbound ? "/inventory?tab=inbound" : "/inventory?tab=outbound";

    // 알림 생성 (담당자 배정 시) - 상세 정보 포함
    if (assigned_to && assigned_to !== oldData.assigned_to) {
      const notifType = isInbound ? "inbound_assignment" : "outbound_assignment";
      const notifTitle = `${taskTypeText} 담당 배정`;
      let message = `${changerName}님이 ${taskTypeText} 작업을 배정했습니다.\n`;
      message += `• 문서번호: ${oldData.document_number}\n`;
      message += `• 거래처: ${companyName}`;
      if (expected_date || oldData.expected_date) {
        message += `\n• 예정일: ${expected_date || oldData.expected_date}`;
      }

      const { data: createdNotif } = await supabase
        .from("notifications")
        .insert({
          user_id: assigned_to,
          type: notifType,
          title: notifTitle,
          message,
          related_id: id,
          related_type: isInbound ? "inbound" : "outbound",
        })
        .select("id")
        .single();

      // PWA 푸시 발송 (notification_id 포함)
      await sendPushToUser(assigned_to, notifTitle, message, inventoryUrl, notifType, createdNotif?.id);
    }

    // 알림 생성 (예정일 변경 시, 담당자에게)
    if (
      changedFields.includes("expected_date") &&
      oldData.assigned_to &&
      oldData.assigned_to !== user_id
    ) {
      const notifType = isInbound ? "inbound_date_change" : "outbound_date_change";
      const notifTitle = `${taskTypeText} 예정일 변경`;
      const message = `${changerName}님이 ${taskTypeText} 예정일을 변경했습니다.\n• 문서번호: ${oldData.document_number}\n• 거래처: ${companyName}\n• 변경: ${oldData.expected_date || "미정"} → ${expected_date}`;

      const { data: createdNotif } = await supabase
        .from("notifications")
        .insert({
          user_id: oldData.assigned_to,
          type: notifType,
          title: notifTitle,
          message,
          related_id: id,
          related_type: isInbound ? "inbound" : "outbound",
        })
        .select("id")
        .single();

      // PWA 푸시 발송 (notification_id 포함)
      await sendPushToUser(oldData.assigned_to, notifTitle, message, inventoryUrl, notifType, createdNotif?.id);
    }

    // 알림 생성 (완료 시, 지정자에게)
    if (changedFields.includes("status") && status === "completed" && oldData.assigned_by) {
      // 본인이 지정자가 아닌 경우에만 알림
      if (oldData.assigned_by !== user_id) {
        const notifType = isInbound ? "inbound_confirmed" : "outbound_confirmed";
        const notifTitle = `${taskTypeText} 확인 완료`;
        const message = `${changerName}님이 ${taskTypeText}를 확인했습니다.\n• 문서번호: ${oldData.document_number}\n• 거래처: ${companyName}`;

        const { data: createdNotif } = await supabase
          .from("notifications")
          .insert({
            user_id: oldData.assigned_by,
            type: notifType,
            title: notifTitle,
            message,
            related_id: id,
            related_type: isInbound ? "inbound" : "outbound",
          })
          .select("id")
          .single();

        // PWA 푸시 발송 (notification_id 포함)
        await sendPushToUser(oldData.assigned_by, notifTitle, message, inventoryUrl, notifType, createdNotif?.id);
      }
    }

    // 알림 생성 (취소 시, 지정자/담당자에게)
    if (changedFields.includes("status") && status === "canceled") {
      const notifType = isInbound ? "inbound_canceled" : "outbound_canceled";
      const notifTitle = `${taskTypeText} 취소`;
      let message = `${changerName}님이 ${taskTypeText}를 취소했습니다.\n• 문서번호: ${oldData.document_number}\n• 거래처: ${companyName}`;
      if (cancel_reason) {
        message += `\n• 사유: ${cancel_reason}`;
      }

      // 알림 받을 사용자 목록 (지정자 + 담당자, 본인 제외)
      const recipientIds = new Set<string>();
      if (oldData.assigned_by && oldData.assigned_by !== user_id) {
        recipientIds.add(oldData.assigned_by);
      }
      if (oldData.assigned_to && oldData.assigned_to !== user_id) {
        recipientIds.add(oldData.assigned_to);
      }

      // 알림 생성 + PWA 푸시 발송
      for (const recipientId of recipientIds) {
        const { data: createdNotif } = await supabase
          .from("notifications")
          .insert({
            user_id: recipientId,
            type: notifType,
            title: notifTitle,
            message,
            related_id: id,
            related_type: isInbound ? "inbound" : "outbound",
          })
          .select("id")
          .single();

        // PWA 푸시 발송 (notification_id 포함)
        await sendPushToUser(recipientId, notifTitle, message, inventoryUrl, notifType, createdNotif?.id);
      }
    }

    return NextResponse.json({
      message: "재고 작업이 수정되었습니다",
      task: data,
    });
  } catch (error) {
    console.error("재고 작업 수정 에러:", error);
    return NextResponse.json(
      { error: "재고 작업 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 재고 작업 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    // 기존 데이터 조회
    const { data: oldData, error: fetchError } = await supabase
      .from("inventory_tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !oldData) {
      return NextResponse.json(
        { error: "재고 작업을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 삭제
    const { error } = await supabase
      .from("inventory_tasks")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`재고 작업 삭제 실패: ${error.message}`);
    }

    // 로그 기록
    await supabase.from("logs").insert({
      table_name: "inventory_tasks",
      operation: "DELETE",
      record_id: id,
      old_data: oldData,
      new_data: null,
      changed_by: user_id || null,
    });

    return NextResponse.json({ message: "재고 작업이 삭제되었습니다" });
  } catch (error) {
    console.error("재고 작업 삭제 에러:", error);
    return NextResponse.json(
      { error: "재고 작업 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
