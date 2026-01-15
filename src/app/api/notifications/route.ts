import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

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
      "document_expiry",
      "consultation_followup",
      "todo_reminder",
      "system",
      "post_comment",    // 게시글에 댓글 달림
      "post_mention",    // @멘션됨
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
