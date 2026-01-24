import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface MonthlyStats {
  month: string;
  approved: number;
  rejected: number;
  pending: number;
}

interface CategoryStats {
  category_id: string;
  category_name: string;
  count: number;
  approved: number;
  rejected: number;
  pending: number;
}

interface ProcessingTimeStats {
  avg_hours: number;
  min_hours: number;
  max_hours: number;
  total_completed: number;
}

/**
 * 결재 통계 조회 API
 * - 월별 결재 추이 (최근 6개월)
 * - 카테고리별 통계
 * - 평균 처리 시간
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const scope = searchParams.get("scope") || "all"; // "all" | "my"

    // 최근 6개월 범위 계산
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sixMonthsAgoISO = sixMonthsAgo.toISOString();

    // 1. 월별 결재 통계 (최근 6개월)
    const monthlyQuery = supabase
      .from("approval_requests")
      .select("id, status, created_at, completed_at")
      .gte("created_at", sixMonthsAgoISO);

    if (scope === "my" && user_id) {
      monthlyQuery.eq("requester_id", user_id);
    }

    const { data: monthlyData, error: monthlyError } = await monthlyQuery;

    if (monthlyError) {
      throw monthlyError;
    }

    // 월별로 그룹화
    const monthlyMap = new Map<string, { approved: number; rejected: number; pending: number }>();

    // 최근 6개월 초기화
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(monthKey, { approved: 0, rejected: 0, pending: 0 });
    }

    monthlyData?.forEach((item) => {
      const date = new Date(item.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      if (monthlyMap.has(monthKey)) {
        const stats = monthlyMap.get(monthKey)!;
        if (item.status === "approved") {
          stats.approved++;
        } else if (item.status === "rejected") {
          stats.rejected++;
        } else if (item.status === "pending") {
          stats.pending++;
        }
      }
    });

    const monthlyStats: MonthlyStats[] = Array.from(monthlyMap.entries())
      .map(([month, stats]) => ({
        month,
        ...stats,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 2. 카테고리별 통계
    const categoryQuery = supabase
      .from("approval_requests")
      .select(`
        id,
        status,
        category:approval_categories!inner(id, name)
      `)
      .gte("created_at", sixMonthsAgoISO);

    if (scope === "my" && user_id) {
      categoryQuery.eq("requester_id", user_id);
    }

    const { data: categoryData, error: categoryError } = await categoryQuery;

    if (categoryError) {
      throw categoryError;
    }

    const categoryMap = new Map<string, CategoryStats>();

    categoryData?.forEach((item) => {
      const category = item.category as unknown as { id: string; name: string };
      if (!category) return;

      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          category_id: category.id,
          category_name: category.name,
          count: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
        });
      }

      const stats = categoryMap.get(category.id)!;
      stats.count++;
      if (item.status === "approved") {
        stats.approved++;
      } else if (item.status === "rejected") {
        stats.rejected++;
      } else if (item.status === "pending") {
        stats.pending++;
      }
    });

    const categoryStats: CategoryStats[] = Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count);

    // 3. 평균 처리 시간 (완료된 결재만)
    const timeQuery = supabase
      .from("approval_requests")
      .select("created_at, completed_at")
      .in("status", ["approved", "rejected"])
      .not("completed_at", "is", null)
      .gte("created_at", sixMonthsAgoISO);

    if (scope === "my" && user_id) {
      timeQuery.eq("requester_id", user_id);
    }

    const { data: timeData, error: timeError } = await timeQuery;

    if (timeError) {
      throw timeError;
    }

    let totalHours = 0;
    let minHours = Infinity;
    let maxHours = 0;
    const validItems = timeData?.filter((item) => item.completed_at) || [];

    validItems.forEach((item) => {
      const created = new Date(item.created_at).getTime();
      const completed = new Date(item.completed_at).getTime();
      const hours = (completed - created) / (1000 * 60 * 60);

      totalHours += hours;
      minHours = Math.min(minHours, hours);
      maxHours = Math.max(maxHours, hours);
    });

    const processingTimeStats: ProcessingTimeStats = {
      avg_hours: validItems.length > 0 ? Math.round(totalHours / validItems.length * 10) / 10 : 0,
      min_hours: validItems.length > 0 ? Math.round(minHours * 10) / 10 : 0,
      max_hours: validItems.length > 0 ? Math.round(maxHours * 10) / 10 : 0,
      total_completed: validItems.length,
    };

    // 4. 전체 통계 요약
    const totalApproved = monthlyData?.filter((item) => item.status === "approved").length || 0;
    const totalRejected = monthlyData?.filter((item) => item.status === "rejected").length || 0;
    const totalPending = monthlyData?.filter((item) => item.status === "pending").length || 0;
    const totalDraft = monthlyData?.filter((item) => item.status === "draft").length || 0;

    const approvalRate = totalApproved + totalRejected > 0
      ? Math.round((totalApproved / (totalApproved + totalRejected)) * 100)
      : 0;

    return NextResponse.json({
      monthly: monthlyStats,
      categories: categoryStats,
      processing_time: processingTimeStats,
      summary: {
        total: monthlyData?.length || 0,
        approved: totalApproved,
        rejected: totalRejected,
        pending: totalPending,
        draft: totalDraft,
        approval_rate: approvalRate,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/approvals/statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch approval statistics" },
      { status: 500 }
    );
  }
}
