import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const userId = searchParams.get("userId");
    const actionType = searchParams.get("actionType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const offset = (page - 1) * limit;

    let query = supabase
      .from("user_activity_logs")
      .select(
        `
        id,
        user_id,
        action,
        action_type,
        target_type,
        target_id,
        target_name,
        details,
        ip_address,
        created_at,
        users:user_id (name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // 필터 적용
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (actionType) {
      query = query.eq("action_type", actionType);
    }
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59`);
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
    console.error("활동 로그 조회 오류:", error);
    return NextResponse.json(
      { error: "활동 로그를 조회할 수 없습니다" },
      { status: 500 }
    );
  }
}

// 활동 통계
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userId } = body;

    if (type === "stats") {
      // 오늘 통계
      const today = new Date().toISOString().split("T")[0];

      // 전체 활동 통계
      const { data: todayStats, error: statsError } = await supabase
        .from("user_activity_logs")
        .select("action_type")
        .gte("created_at", `${today}T00:00:00`);

      if (statsError) throw statsError;

      // action_type 별 집계
      const actionTypeCounts: Record<string, number> = {};
      todayStats?.forEach((log) => {
        actionTypeCounts[log.action_type] = (actionTypeCounts[log.action_type] || 0) + 1;
      });

      // 최근 7일간 일별 활동 수
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: weeklyStats, error: weeklyError } = await supabase
        .from("user_activity_logs")
        .select("created_at")
        .gte("created_at", sevenDaysAgo.toISOString());

      if (weeklyError) throw weeklyError;

      const dailyCounts: Record<string, number> = {};
      weeklyStats?.forEach((log) => {
        const date = log.created_at.split("T")[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });

      return NextResponse.json({
        today: {
          total: todayStats?.length || 0,
          byType: actionTypeCounts,
        },
        weekly: dailyCounts,
      });
    }

    if (type === "user-stats" && userId) {
      // 특정 사용자 활동 통계
      const { data: userStats, error } = await supabase
        .from("user_activity_logs")
        .select("action_type, action")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const actionCounts: Record<string, number> = {};
      userStats?.forEach((log) => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });

      return NextResponse.json({
        totalActions: userStats?.length || 0,
        actionCounts,
      });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    console.error("활동 통계 조회 오류:", error);
    return NextResponse.json(
      { error: "활동 통계를 조회할 수 없습니다" },
      { status: 500 }
    );
  }
}
