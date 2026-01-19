import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// 알림 카테고리 정의 (route 파일에서는 export 불가)
const NOTIFICATION_CATEGORIES = {
  documents: {
    label: "문서",
    types: ["document_expiry", "estimate_completed", "order_completed"],
    description: "견적서, 발주서 관련 알림",
  },
  board: {
    label: "게시판",
    types: ["post_comment", "post_mention", "post_reply"],
    description: "댓글, 멘션, 대댓글 알림",
  },
  inventory: {
    label: "입출고",
    types: [
      "inventory_assignment",
      "inventory_update",
      "inventory_complete",
      "inventory_cancel",
      "inbound_assignment",
      "inbound_date_change",
      "inbound_confirmed",
      "inbound_canceled",
      "outbound_assignment",
      "outbound_date_change",
      "outbound_confirmed",
      "outbound_canceled",
    ],
    description: "입고/출고 담당 배정, 상태 변경 알림",
  },
  workOrders: {
    label: "작업지시",
    types: [
      "work_order_assignment",
      "work_order_unassignment",
      "work_order_comment",
      "work_order_update",
      "work_order_status",
      "work_order_deadline",
      "work_order_progress",
      "work_order_completed",
      "work_order_file",
    ],
    description: "작업지시 배정, 댓글, 상태 변경 알림",
  },
  consultations: {
    label: "상담",
    types: ["consultation_followup"],
    description: "상담 후속조치 알림",
  },
  todos: {
    label: "할일",
    types: ["todo_reminder"],
    description: "할일 리마인더 알림",
  },
  system: {
    label: "시스템",
    types: ["system"],
    description: "시스템 공지 알림",
  },
} as const;

type NotificationCategory = keyof typeof NOTIFICATION_CATEGORIES;

// GET: 사용자의 알림 설정 조회
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

    // 사용자의 알림 설정 조회
    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    // 기본 설정 (모든 알림 활성화)
    const defaultSettings: Record<NotificationCategory, boolean> = {
      documents: true,
      board: true,
      inventory: true,
      workOrders: true,
      consultations: true,
      todos: true,
      system: true,
    };

    return NextResponse.json({
      settings: data?.settings || defaultSettings,
      categories: NOTIFICATION_CATEGORIES,
    });
  } catch (error) {
    console.error("알림 설정 조회 에러:", error);
    return NextResponse.json(
      { error: "알림 설정 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 알림 설정 저장/업데이트
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, settings } = body;

    if (!user_id || !settings) {
      return NextResponse.json(
        { error: "user_id와 settings가 필요합니다" },
        { status: 400 }
      );
    }

    // upsert로 저장
    const { data, error } = await supabase
      .from("notification_settings")
      .upsert(
        {
          user_id,
          settings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "알림 설정이 저장되었습니다",
      settings: data.settings,
    });
  } catch (error) {
    console.error("알림 설정 저장 에러:", error);
    return NextResponse.json(
      { error: "알림 설정 저장 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
