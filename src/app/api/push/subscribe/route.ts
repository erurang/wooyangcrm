import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 푸시 구독 저장 API
 * POST /api/push/subscribe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, userId } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "구독 정보가 필요합니다." },
        { status: 400 }
      );
    }

    // 기존 구독 확인 (endpoint 기준)
    const { data: existing } = await supabase
      .from("push_subscriptions")
      .select("id")
      .eq("endpoint", subscription.endpoint)
      .single();

    if (existing) {
      // 기존 구독 업데이트
      const { error } = await supabase
        .from("push_subscriptions")
        .update({
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
          user_id: userId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        console.error("구독 업데이트 실패:", error);
        return NextResponse.json(
          { error: "구독 업데이트에 실패했습니다." },
          { status: 500 }
        );
      }
    } else {
      // 새 구독 생성
      const { error } = await supabase.from("push_subscriptions").insert({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth,
        user_id: userId || null,
      });

      if (error) {
        console.error("구독 저장 실패:", error);
        return NextResponse.json(
          { error: "구독 저장에 실패했습니다." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("푸시 구독 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
