import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { CreateWorkOrderRequest, WorkOrderStatus } from "@/types/production";

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

// GET: 작업지시 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as WorkOrderStatus | null;
    const requester_id = searchParams.get("requester_id");
    const assignee_id = searchParams.get("assignee_id");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
      .from("work_orders")
      .select(`
        *,
        requester:users!work_orders_requester_id_fkey(id, name),
        assignees:work_order_assignees(
          id,
          user_id,
          is_completed,
          completed_at,
          assigned_at,
          user:users!work_order_assignees_user_id_fkey(id, name)
        )
      `)
      .order("created_at", { ascending: false });

    // 상태 필터
    if (status) {
      query = query.eq("status", status);
    }

    // 요청자 필터
    if (requester_id) {
      query = query.eq("requester_id", requester_id);
    }

    // 담당자 필터 (assignee가 있는 work_order만)
    if (assignee_id) {
      // 먼저 해당 담당자가 할당된 work_order_id 목록 조회
      const { data: assignedIds } = await supabase
        .from("work_order_assignees")
        .select("work_order_id")
        .eq("user_id", assignee_id);

      if (assignedIds && assignedIds.length > 0) {
        query = query.in("id", assignedIds.map(a => a.work_order_id));
      } else {
        return NextResponse.json({ workOrders: [], total: 0 });
      }
    }

    // 검색어 필터
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      workOrders: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("작업지시 조회 오류:", error);
    return NextResponse.json(
      { error: "작업지시 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 작업지시 생성
export async function POST(request: Request) {
  try {
    const body: CreateWorkOrderRequest = await request.json();
    const {
      title,
      content,
      deadline_type,
      deadline_start,
      deadline_end,
      requester_id,
      completion_type,
      completion_threshold,
      assignee_ids,
    } = body;

    if (!title || !requester_id) {
      return NextResponse.json(
        { error: "제목과 요청자는 필수입니다" },
        { status: 400 }
      );
    }

    // 작업지시 생성
    const { data: workOrder, error: workOrderError } = await supabase
      .from("work_orders")
      .insert([
        {
          title,
          content: content || null,
          deadline_type: deadline_type || "none",
          deadline_start: deadline_start || null,
          deadline_end: deadline_end || null,
          requester_id,
          completion_type: completion_type || "any",
          completion_threshold: completion_threshold || 1,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (workOrderError) throw workOrderError;

    // 담당자 할당
    if (assignee_ids && assignee_ids.length > 0) {
      const assignees = assignee_ids.map((userId) => ({
        work_order_id: workOrder.id,
        user_id: userId,
        assigned_by: requester_id,
      }));

      const { error: assigneeError } = await supabase
        .from("work_order_assignees")
        .insert(assignees);

      if (assigneeError) throw assigneeError;

      // 요청자 이름 조회
      const { data: requester } = await supabase
        .from("users")
        .select("name")
        .eq("id", requester_id)
        .single();

      const requesterName = requester?.name || "알 수 없음";
      const notifTitle = "새 작업지시 배정";
      const notifMessage = `${requesterName}님이 "${title}" 작업을 배정했습니다.`;

      // DB 알림 생성
      const notifications = assignee_ids.map((userId) => ({
        user_id: userId,
        type: "work_order_assignment",
        title: notifTitle,
        message: notifMessage,
        related_id: workOrder.id,
        related_type: "work_order",
        read: false,
      }));

      const { data: createdNotifs, error: notifyError } = await supabase
        .from("notifications")
        .insert(notifications)
        .select("id, user_id");

      if (notifyError) {
        console.error("알림 생성 실패:", notifyError);
      } else {
        // PWA 푸시 발송 (notification_id 포함)
        for (const userId of assignee_ids) {
          const notifRecord = createdNotifs?.find((n) => n.user_id === userId);
          await sendPushToUser(
            userId,
            notifTitle,
            notifMessage,
            `/production/work-orders/${workOrder.id}`,
            "work_order_assignment",
            notifRecord?.id
          );
        }
      }
    }

    // 활동 로그 기록
    await supabase.from("work_order_logs").insert([
      {
        work_order_id: workOrder.id,
        user_id: requester_id,
        action: "created",
        new_data: { title, content, deadline_type, completion_type, assignee_ids },
        description: `작업지시 "${title}" 생성됨`,
      },
    ]);

    return NextResponse.json({
      message: "작업지시가 생성되었습니다",
      workOrder,
    });
  } catch (error) {
    console.error("작업지시 생성 오류:", error);
    return NextResponse.json(
      { error: "작업지시 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
