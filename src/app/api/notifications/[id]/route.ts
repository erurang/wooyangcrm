import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 단일 알림 조회
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const notificationId = parseInt(id, 10);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { error: "유효하지 않은 알림 ID입니다" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notificationId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "알림을 찾을 수 없습니다" },
          { status: 404 }
        );
      }
      throw new Error(`알림 조회 실패: ${error.message}`);
    }

    return NextResponse.json({ notification: data });
  } catch (error) {
    console.error("알림 조회 에러:", error);
    return NextResponse.json(
      { error: "알림 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 알림 읽음 처리
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const notificationId = parseInt(id, 10);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { error: "유효하지 않은 알림 ID입니다" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      throw new Error(`알림 읽음 처리 실패: ${error.message}`);
    }

    return NextResponse.json({ message: "알림이 읽음 처리되었습니다" });
  } catch (error) {
    console.error("알림 읽음 처리 에러:", error);
    return NextResponse.json(
      { error: "알림 읽음 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 알림 삭제
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const notificationId = parseInt(id, 10);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { error: "유효하지 않은 알림 ID입니다" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (error) {
      throw new Error(`알림 삭제 실패: ${error.message}`);
    }

    return NextResponse.json({ message: "알림이 삭제되었습니다" });
  } catch (error) {
    console.error("알림 삭제 에러:", error);
    return NextResponse.json(
      { error: "알림 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
