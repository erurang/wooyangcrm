import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import webPush from "web-push";

// VAPID 설정
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@wooyang.com";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

// POST: 관리자가 수동으로 알림 발송 (DB + PWA 푸시)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_ids, title, message, sender_id } = body;

    // 필수 필드 검증
    if (!user_ids || user_ids.length === 0) {
      return NextResponse.json(
        { error: "수신자를 선택해주세요" },
        { status: 400 }
      );
    }

    if (!title || !message) {
      return NextResponse.json(
        { error: "제목과 내용을 입력해주세요" },
        { status: 400 }
      );
    }

    // 발송자 정보 조회
    let senderName = "시스템 관리자";
    if (sender_id) {
      const { data: sender } = await supabase
        .from("users")
        .select("name")
        .eq("id", sender_id)
        .single();

      if (sender) {
        senderName = sender.name;
      }
    }

    // 1. DB 알림 생성
    const notifications = user_ids.map((userId: string) => ({
      user_id: userId,
      type: "system",
      title: title,
      message: `[${senderName}] ${message}`,
      related_id: null,
      related_type: "admin_notification",
      read: false,
    }));

    const { data, error } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    if (error) {
      console.error("알림 발송 실패:", error);
      throw new Error(`알림 발송 실패: ${error.message}`);
    }

    // 2. PWA 푸시 알림 발송
    let pushSent = 0;
    let pushFailed = 0;

    if (vapidPublicKey && vapidPrivateKey) {
      // 대상 사용자의 푸시 구독 정보 조회
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("user_id", user_ids);

      if (subscriptions && subscriptions.length > 0) {
        const payload = JSON.stringify({
          title: title,
          body: `[${senderName}] ${message}`,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-192x192.png",
          url: "/",
          tag: "admin-notification",
        });

        // 각 구독에 푸시 발송
        const pushResults = await Promise.allSettled(
          subscriptions.map(async (sub) => {
            const pushSubscription = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            };

            try {
              await webPush.sendNotification(pushSubscription, payload);
              return { success: true };
            } catch (err: any) {
              // 410 Gone - 구독 만료됨
              if (err.statusCode === 410 || err.statusCode === 404) {
                await supabase
                  .from("push_subscriptions")
                  .delete()
                  .eq("endpoint", sub.endpoint);
              }
              return { success: false, error: err.message };
            }
          })
        );

        pushSent = pushResults.filter(
          (r) => r.status === "fulfilled" && r.value.success
        ).length;
        pushFailed = pushResults.length - pushSent;
      }
    }

    // 발송 로그 기록
    try {
      await supabase.from("admin_notification_logs").insert({
        sender_id: sender_id,
        recipient_count: user_ids.length,
        title: title,
        message: message,
        push_sent: pushSent,
        push_failed: pushFailed,
        created_at: new Date().toISOString(),
      });
    } catch {
      // 로그 테이블이 없어도 무시
    }

    return NextResponse.json({
      success: true,
      message: `${user_ids.length}명에게 알림이 발송되었습니다`,
      count: data?.length || 0,
      push: {
        sent: pushSent,
        failed: pushFailed,
      },
    });
  } catch (error) {
    console.error("관리자 알림 발송 에러:", error);
    return NextResponse.json(
      { error: "알림 발송 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
