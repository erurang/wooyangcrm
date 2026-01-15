import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIds = searchParams.getAll("userIds[]"); // 여러 개의 userId 처리
    const startDate = searchParams.get("startDate") || null;
    const endDate = searchParams.get("endDate") || null;

    if (!userIds.length) {
      return NextResponse.json(
        { error: "userIds 배열이 필요합니다." },
        { status: 400 }
      );
    }

    // RPC 호출
    const { data, error } = await supabase.rpc("get_user_sales_summary", {
      user_ids: userIds,
      start_date: startDate,
      end_date: endDate,
    });

    if (error) throw error;

    // ✅ 데이터를 사용자별로 정리
    const result = userIds.reduce((acc, userId) => {
      acc[userId] = {
        estimates: { pending: 0, completed: 0, canceled: 0, total: 0 },
        orders: { pending: 0, completed: 0, canceled: 0, total: 0 },
      };
      return acc;
    }, {} as Record<string, any>);

    data.forEach(({ user_id, type, status, total_amount }: any) => {
      if (type === "estimate") {
        result[user_id].estimates[status] = total_amount;
        result[user_id].estimates.total += total_amount;
      } else if (type === "order") {
        result[user_id].orders[status] = total_amount;
        result[user_id].orders.total += total_amount;
      }
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("문서 총액 가져오기 실패:", error);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
