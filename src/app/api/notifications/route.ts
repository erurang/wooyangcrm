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
async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url: string,
  tag: string,
  notificationId?: number
) {
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

/**
 * 알림 타입에 따른 URL 결정
 */
function getNotificationUrl(type: string, relatedId: string | null, relatedType: string | null): string {
  if (!relatedId) return "/";

  switch (relatedType) {
    case "work_order":
      return `/production?view=${relatedId}`;
    case "document":
      return `/documents/${relatedId}`;
    case "consultation":
      return "/consultations";
    case "post":
      return `/board/${relatedId}`;
    case "inventory_task":
      return "/inventory";
    default:
      return "/";
  }
}

// GET: 사용자의 알림 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`알림 조회 실패: ${error.message}`);
    }

    return NextResponse.json({ notifications: data || [] });
  } catch (error) {
    console.error("알림 조회 에러:", error);
    return NextResponse.json(
      { error: "알림 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 새 알림 생성 (시스템 내부용)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, type, title, message, related_id, related_type } = body;

    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다 (user_id, type, title, message)" },
        { status: 400 }
      );
    }

    const validTypes = [
      // 문서 관련
      "document_expiry",        // 문서 만료 임박
      "estimate_completed",     // 견적서 완료 → 출고 리스트 등록
      "order_completed",        // 발주서 완료 → 입고 리스트 등록
      // 상담 관련
      "consultation_followup",  // 상담 후속조치
      // 할일 관련
      "todo_reminder",          // 할일 알림
      // 게시판 관련
      "post_comment",           // 내 게시글에 댓글
      "post_mention",           // 멘션됨
      "post_reply",             // 내 댓글에 대댓글
      // 재고 입출고 관련 (기존)
      "inventory_assignment",   // 입출고 담당 배정
      "inventory_update",       // 입출고 정보 변경
      "inventory_complete",     // 입출고 확인 완료
      "inventory_cancel",       // 입출고 취소
      // 입고 관련
      "inbound_assignment",     // 입고 담당 지정
      "inbound_date_change",    // 입고 예정일 변경
      "inbound_confirmed",      // 입고 확인 완료
      "inbound_canceled",       // 입고 취소
      // 출고 관련
      "outbound_assignment",    // 출고 담당 지정
      "outbound_date_change",   // 출고 예정일 변경
      "outbound_confirmed",     // 출고 확인 완료
      "outbound_canceled",      // 출고 취소
      // 작업지시 관련
      "work_order_assignment",   // 작업지시 담당자 배정
      "work_order_unassignment", // 작업지시 담당 해제
      "work_order_comment",      // 작업지시 댓글
      "work_order_update",       // 작업지시 내용 수정
      "work_order_status",       // 작업지시 상태 변경
      "work_order_deadline",     // 작업지시 일자/기한 변경
      "work_order_progress",     // 작업지시 진행 상황
      "work_order_completed",    // 작업지시 완료
      "work_order_file",         // 작업지시 파일 추가
      // 시스템
      "system",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `유효하지 않은 type입니다. 허용: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          user_id,
          type,
          title,
          message,
          related_id: related_id || null,
          related_type: related_type || null,
          read: false,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`알림 생성 실패: ${error.message}`);
    }

    // PWA 푸시 알림 발송
    const notificationUrl = getNotificationUrl(type, related_id, related_type);
    await sendPushToUser(user_id, title, message, notificationUrl, type, data?.id);

    return NextResponse.json({ message: "알림이 생성되었습니다", notification: data });
  } catch (error) {
    console.error("알림 생성 에러:", error);
    return NextResponse.json(
      { error: "알림 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 모든 알림 읽음 처리
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      throw new Error(`알림 읽음 처리 실패: ${error.message}`);
    }

    return NextResponse.json({ message: "모든 알림이 읽음 처리되었습니다" });
  } catch (error) {
    console.error("알림 읽음 처리 에러:", error);
    return NextResponse.json(
      { error: "알림 읽음 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
