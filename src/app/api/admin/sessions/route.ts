import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const isActive = searchParams.get("isActive");
    const userId = searchParams.get("userId");

    const offset = (page - 1) * limit;

    let query = supabase
      .from("user_sessions")
      .select(
        `
        id,
        user_id,
        ip_address,
        user_agent,
        device_type,
        browser,
        os,
        login_at,
        logout_at,
        is_active,
        last_activity_at,
        users:user_id (name, email)
      `,
        { count: "exact" }
      )
      .order("login_at", { ascending: false });

    // 필터 적용
    if (isActive === "true") {
      query = query.eq("is_active", true);
    } else if (isActive === "false") {
      query = query.eq("is_active", false);
    }

    if (userId) {
      query = query.eq("user_id", userId);
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data: sessions, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      sessions: sessions || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("세션 조회 오류:", error);
    return NextResponse.json(
      { error: "세션을 조회할 수 없습니다" },
      { status: 500 }
    );
  }
}

// 세션 통계 및 관리
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, sessionId, userId } = body;

    if (type === "stats") {
      // 현재 활성 세션 수
      const { count: activeSessions, error: activeError } = await supabase
        .from("user_sessions")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      if (activeError) throw activeError;

      // 오늘 로그인 수
      const today = new Date().toISOString().split("T")[0];
      const { count: todayLogins, error: todayError } = await supabase
        .from("user_sessions")
        .select("*", { count: "exact", head: true })
        .gte("login_at", `${today}T00:00:00`);

      if (todayError) throw todayError;

      // 디바이스별 세션
      const { data: deviceStats, error: deviceError } = await supabase
        .from("user_sessions")
        .select("device_type")
        .eq("is_active", true);

      if (deviceError) throw deviceError;

      const deviceCounts: Record<string, number> = {};
      deviceStats?.forEach((s) => {
        deviceCounts[s.device_type || "unknown"] =
          (deviceCounts[s.device_type || "unknown"] || 0) + 1;
      });

      return NextResponse.json({
        activeSessions: activeSessions || 0,
        todayLogins: todayLogins || 0,
        deviceStats: deviceCounts,
      });
    }

    if (type === "terminate" && sessionId) {
      // 특정 세션 종료
      const { error } = await supabase
        .from("user_sessions")
        .update({
          is_active: false,
          logout_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) throw error;

      return NextResponse.json({ success: true, message: "세션이 종료되었습니다" });
    }

    if (type === "terminate-all" && userId) {
      // 특정 사용자의 모든 세션 종료
      const { error } = await supabase
        .from("user_sessions")
        .update({
          is_active: false,
          logout_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;

      return NextResponse.json({ success: true, message: "모든 세션이 종료되었습니다" });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    console.error("세션 관리 오류:", error);
    return NextResponse.json(
      { error: "세션 관리에 실패했습니다" },
      { status: 500 }
    );
  }
}
