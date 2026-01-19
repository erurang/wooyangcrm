import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webPush from "web-push";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// VAPID 설정
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, any>;
}

/**
 * 푸시 알림 발송 API
 * POST /api/push/send
 *
 * Body:
 * - userId?: string - 특정 사용자에게만 발송
 * - userIds?: string[] - 여러 사용자에게 발송
 * - all?: boolean - 모든 구독자에게 발송
 * - title: string - 알림 제목
 * - body: string - 알림 내용
 * - url?: string - 클릭 시 이동할 URL
 */
export async function POST(request: NextRequest) {
  try {
    // VAPID 키 확인
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: "VAPID 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userId, userIds, all, title, body: messageBody, url } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: "title과 body가 필요합니다." },
        { status: 400 }
      );
    }

    // 구독 목록 조회
    let query = supabase.from("push_subscriptions").select("*");

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (userIds && userIds.length > 0) {
      query = query.in("user_id", userIds);
    } else if (!all) {
      return NextResponse.json(
        { error: "userId, userIds, 또는 all 중 하나가 필요합니다." },
        { status: 400 }
      );
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error("구독 목록 조회 실패:", fetchError);
      return NextResponse.json(
        { error: "구독 목록 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: "알림을 받을 구독자가 없습니다.", sent: 0 },
        { status: 200 }
      );
    }

    // 푸시 알림 페이로드
    const payload: PushPayload = {
      title,
      body: messageBody,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      url: url || "/",
    };

    // 알림 발송
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webPush.sendNotification(
            pushSubscription,
            JSON.stringify(payload)
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (err: any) {
          // 410 Gone - 구독이 만료됨
          if (err.statusCode === 410 || err.statusCode === 404) {
            // 만료된 구독 삭제
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
          return { success: false, endpoint: sub.endpoint, error: err.message };
        }
      })
    );

    const sent = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - sent;

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: results.length,
    });
  } catch (error) {
    console.error("푸시 발송 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
