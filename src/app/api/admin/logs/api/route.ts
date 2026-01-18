import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const endpoint = searchParams.get("endpoint");
    const method = searchParams.get("method");
    const statusCode = searchParams.get("statusCode");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");

    const offset = (page - 1) * limit;

    let query = supabase
      .from("api_logs")
      .select(
        `
        id,
        user_id,
        endpoint,
        method,
        status_code,
        response_time_ms,
        ip_address,
        user_agent,
        error_message,
        created_at,
        users:user_id (name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // 필터 적용
    if (endpoint) {
      query = query.ilike("endpoint", `%${endpoint}%`);
    }
    if (method) {
      query = query.eq("method", method);
    }
    if (statusCode) {
      const code = parseInt(statusCode);
      if (code >= 200 && code < 300) {
        query = query.gte("status_code", 200).lt("status_code", 300);
      } else if (code >= 400 && code < 500) {
        query = query.gte("status_code", 400).lt("status_code", 500);
      } else if (code >= 500) {
        query = query.gte("status_code", 500);
      }
    }
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59`);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("API 로그 조회 오류:", error);
    return NextResponse.json(
      { error: "API 로그를 조회할 수 없습니다" },
      { status: 500 }
    );
  }
}

// API 로그 통계
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === "stats") {
      // 오늘 통계
      const today = new Date().toISOString().split("T")[0];

      const { data: todayStats, error: statsError } = await supabase
        .from("api_logs")
        .select("status_code, response_time_ms")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`);

      if (statsError) throw statsError;

      const totalCalls = todayStats?.length || 0;
      const successCalls = todayStats?.filter(
        (l) => l.status_code && l.status_code >= 200 && l.status_code < 300
      ).length || 0;
      const errorCalls = todayStats?.filter(
        (l) => l.status_code && l.status_code >= 400
      ).length || 0;
      const avgResponseTime =
        totalCalls > 0
          ? Math.round(
              todayStats!.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) /
                totalCalls
            )
          : 0;

      // 엔드포인트별 통계 (상위 10개)
      const { data: endpointStats, error: endpointError } = await supabase
        .from("api_logs")
        .select("endpoint")
        .gte("created_at", `${today}T00:00:00`);

      if (endpointError) throw endpointError;

      const endpointCounts: Record<string, number> = {};
      endpointStats?.forEach((log) => {
        endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
      });

      const topEndpoints = Object.entries(endpointCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count }));

      return NextResponse.json({
        today: {
          totalCalls,
          successCalls,
          errorCalls,
          avgResponseTime,
          successRate: totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0,
        },
        topEndpoints,
      });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    console.error("API 통계 조회 오류:", error);
    return NextResponse.json(
      { error: "API 통계를 조회할 수 없습니다" },
      { status: 500 }
    );
  }
}
