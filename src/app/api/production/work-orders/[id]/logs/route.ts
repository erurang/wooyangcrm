import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 작업지시 활동 로그 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("work_order_logs")
      .select(`
        *,
        user:users(id, name)
      `)
      .eq("work_order_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ logs: data || [] });
  } catch (error) {
    console.error("활동 로그 조회 오류:", error);
    return NextResponse.json(
      { error: "활동 로그 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
