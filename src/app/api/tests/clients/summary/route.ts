import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

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

    // 🔹 후속 상담 필요 고객, 상위 고객, 최고 매출 고객 가져오기
    const [followUpClientsResult, topClientsResult] = await Promise.all([
      supabase
        .rpc("get_follow_up_clients", { user_id_param: userId })
        .order("last_consultation", { ascending: false })
        .limit(10),
      supabase.rpc("get_top_clients", { user_id_param: userId }).limit(3),
    ]);

    // 🔹 에러 확인
    if (followUpClientsResult.error || topClientsResult.error) {
      return NextResponse.json(
        {
          error: {
            followUpClients: followUpClientsResult.error?.message,
            topClients: topClientsResult.error?.message,
          },
        },
        { status: 500 }
      );
    }

    // 🔹 데이터 정리
    const followUpClients = followUpClientsResult.data;
    const topClients = topClientsResult.data.map((client: any) => ({
      ...client,
    }));

    // 🔹 응답 반환
    return NextResponse.json({
      followUpClients,
      clients: topClients,
    });
  } catch (error) {
    console.error("Error fetching client summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch client summary" },
      { status: 500 }
    );
  }
}
