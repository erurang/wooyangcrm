import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email"); // 유저 ID 가져오기

    if (!email) {
      return NextResponse.json(
        { error: "email ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("login_logs")
      .select("ip_address, login_time, user_agent")
      .eq("email", email)
      .limit(2)
      .order("login_time", { ascending: false });
    if (error) {
      throw new Error(`Error fetching login logs: ${error.message}`);
    }

    // 데이터가 없거나 빈 배열인 경우 처리
    if (!data || data.length === 0) {
      return NextResponse.json(null);
    }

    // 가장 최근 로그인 기록 반환 (이전 로그인 기록이 있으면 두 번째 항목, 없으면 첫 번째)
    if (data.length === 1) {
      return NextResponse.json(data[0]);
    }
    // data.length >= 2인 경우, 이전 로그인 기록(두 번째 항목) 반환
    return NextResponse.json(data[1]);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}
