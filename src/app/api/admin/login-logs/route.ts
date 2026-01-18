import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const offset = (page - 1) * limit;

    // login_logs 테이블에서 조회
    let query = supabase
      .from("login_logs")
      .select("*", { count: "exact" })
      .order("login_time", { ascending: false });

    // 검색 필터
    if (search) {
      query = query.or(`email.ilike.%${search}%,ip_address.ilike.%${search}%`);
    }

    // 날짜 필터
    if (startDate) {
      query = query.gte("login_time", `${startDate}T00:00:00`);
    }
    if (endDate) {
      query = query.lte("login_time", `${endDate}T23:59:59`);
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) throw error;

    // 이메일로 사용자 정보 조회
    const emails = [...new Set(logs?.map(log => log.email) || [])];
    const { data: users } = await supabase
      .from("users")
      .select("email, name")
      .in("email", emails);

    const userMap: Record<string, string> = {};
    users?.forEach(u => {
      userMap[u.email] = u.name;
    });

    // 로그 데이터 변환
    const formattedLogs = logs?.map(log => ({
      id: log.id.toString(),
      timestamp: log.login_time,
      email: log.email,
      userName: userMap[log.email] || log.email,
      action: "login" as const,
      ip: log.ip_address,
      userAgent: log.user_agent || "unknown",
      success: true,
      latitude: log.latitude,
      longitude: log.longitude,
    })) || [];

    return NextResponse.json({
      logs: formattedLogs,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("로그인 로그 조회 오류:", error);
    return NextResponse.json(
      { error: "로그인 로그를 조회할 수 없습니다" },
      { status: 500 }
    );
  }
}

// 통계 조회
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === "stats") {
      const today = new Date().toISOString().split("T")[0];

      // 오늘 로그인 수
      const { count: todayLogins } = await supabase
        .from("login_logs")
        .select("*", { count: "exact", head: true })
        .gte("login_time", `${today}T00:00:00`);

      // 전체 로그인 수 (최근 7일)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: weeklyLogins } = await supabase
        .from("login_logs")
        .select("*", { count: "exact", head: true })
        .gte("login_time", sevenDaysAgo.toISOString());

      // 고유 사용자 수 (오늘)
      const { data: todayUsers } = await supabase
        .from("login_logs")
        .select("email")
        .gte("login_time", `${today}T00:00:00`);

      const uniqueUsers = new Set(todayUsers?.map(u => u.email) || []).size;

      return NextResponse.json({
        todayLogins: todayLogins || 0,
        weeklyLogins: weeklyLogins || 0,
        uniqueUsers,
        failedLogins: 0, // login_logs는 성공한 로그인만 기록
        suspiciousAccess: 0,
      });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    console.error("로그인 통계 조회 오류:", error);
    return NextResponse.json(
      { error: "통계를 조회할 수 없습니다" },
      { status: 500 }
    );
  }
}
