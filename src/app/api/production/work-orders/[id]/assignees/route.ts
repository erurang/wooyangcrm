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

// GET: 담당자 목록 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("work_order_assignees")
      .select(`
        *,
        user:users!work_order_assignees_user_id_fkey(id, name),
        assigned_by_user:users!work_order_assignees_assigned_by_fkey(id, name)
      `)
      .eq("work_order_id", id)
      .order("assigned_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ assignees: data || [] });
  } catch (error) {
    console.error("담당자 조회 오류:", error);
    return NextResponse.json(
      { error: "담당자 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 담당자 추가
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_ids, assigned_by } = body;

    if (!user_ids || user_ids.length === 0) {
      return NextResponse.json(
        { error: "담당자를 선택해주세요" },
        { status: 400 }
      );
    }

    // 담당자 추가
    const assignees = user_ids.map((userId: string) => ({
      work_order_id: id,
      user_id: userId,
      assigned_by: assigned_by || null,
    }));

    const { data, error } = await supabase
      .from("work_order_assignees")
      .upsert(assignees, { onConflict: "work_order_id,user_id" })
      .select(`
        *,
        user:users!work_order_assignees_user_id_fkey(id, name)
      `);

    if (error) throw error;

    // 담당자 이름 조회
    const { data: users } = await supabase
      .from("users")
      .select("id, name")
      .in("id", user_ids);

    const userNames = users?.map((u) => u.name).join(", ") || "";

    // 활동 로그 기록
    await supabase.from("work_order_logs").insert([
      {
        work_order_id: id,
        user_id: assigned_by || null,
        action: "assignee_added",
        new_data: { user_ids },
        description: `담당자 추가됨: ${userNames}`,
      },
    ]);

    // 작업지시 상태를 in_progress로 변경 (pending인 경우)
    await supabase
      .from("work_orders")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "pending");

    // 작업지시 정보 조회 (알림용)
    const { data: workOrder } = await supabase
      .from("work_orders")
      .select("title, requester:users!work_orders_requester_id_fkey(name)")
      .eq("id", id)
      .single();

    // 담당자에게 알림 발송
    if (workOrder) {
      const requesterName = (workOrder.requester as any)?.name || "알 수 없음";
      const notifTitle = "새 작업지시 배정";
      const notifMessage = `${requesterName}님이 "${workOrder.title}" 작업을 배정했습니다.`;

      const notifications = user_ids.map((userId: string) => ({
        user_id: userId,
        type: "work_order_assignment",
        title: notifTitle,
        message: notifMessage,
        related_id: id,
        related_type: "work_order",
        read: false,
      }));

      console.log("Inserting notifications:", notifications);
      const { data: createdNotifs, error: notifyError } = await supabase
        .from("notifications")
        .insert(notifications)
        .select("id, user_id");

      if (notifyError) {
        console.error("알림 생성 실패:", notifyError);
      } else {
        console.log("알림 생성 성공");
        // PWA 푸시 발송 (notification_id 포함)
        for (const userId of user_ids) {
          const notifRecord = createdNotifs?.find((n) => n.user_id === userId);
          await sendPushToUser(
            userId,
            notifTitle,
            notifMessage,
            `/production/work-orders/${id}`,
            "work_order_assignment",
            notifRecord?.id
          );
        }
      }
    } else {
      console.error("작업지시 정보를 찾을 수 없음:", id);
    }

    return NextResponse.json({
      message: "담당자가 추가되었습니다",
      assignees: data,
    });
  } catch (error) {
    console.error("담당자 추가 오류:", error);
    return NextResponse.json(
      { error: "담당자 추가 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 담당자 제거
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const removedBy = searchParams.get("removed_by");

    if (!userId) {
      return NextResponse.json(
        { error: "제거할 담당자 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 담당자 이름 조회
    const { data: user } = await supabase
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();

    const { error } = await supabase
      .from("work_order_assignees")
      .delete()
      .eq("work_order_id", id)
      .eq("user_id", userId);

    if (error) throw error;

    // 활동 로그 기록
    await supabase.from("work_order_logs").insert([
      {
        work_order_id: id,
        user_id: removedBy || null,
        action: "assignee_removed",
        old_data: { user_id: userId },
        description: `담당자 제거됨: ${user?.name || userId}`,
      },
    ]);

    // 제거된 담당자에게 알림 발송
    const { data: workOrder } = await supabase
      .from("work_orders")
      .select("title, requester:users!work_orders_requester_id_fkey(name)")
      .eq("id", id)
      .single();

    if (workOrder) {
      const notifTitle = "작업지시 배정 해제";
      const notifMessage = `"${workOrder.title}" 작업에서 담당자 배정이 해제되었습니다.`;

      const { data: createdNotif } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          type: "work_order_unassignment",
          title: notifTitle,
          message: notifMessage,
          related_id: id,
          related_type: "work_order",
          read: false,
        })
        .select("id")
        .single();

      // PWA 푸시 발송 (notification_id 포함)
      await sendPushToUser(
        userId,
        notifTitle,
        notifMessage,
        `/production/work-orders/${id}`,
        "work_order_unassignment",
        createdNotif?.id
      );
    }

    return NextResponse.json({ message: "담당자가 제거되었습니다" });
  } catch (error) {
    console.error("담당자 제거 오류:", error);
    return NextResponse.json(
      { error: "담당자 제거 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
