import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface WorkOrderWithDeadline {
  user_id: string;
  is_completed: boolean;
  completed_at: string | null;
  assigned_at: string | null;
  work_order: {
    id: string;
    deadline_end: string | null;
    status: string;
  } | null;
}

interface InventoryTask {
  assigned_to: string;
  status: string;
  completed_at: string | null;
  expected_date: string | null;
}

interface ProductionRecord {
  created_by: string;
  production_date: string;
  quantity_produced: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;
    const quarter = searchParams.get("quarter") ? parseInt(searchParams.get("quarter")!) : null;

    // 기간 계산
    let startDate: string;
    let endDate: string;

    if (month) {
      const lastDay = new Date(year, month, 0).getDate();
      startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
    } else if (quarter) {
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = quarter * 3;
      const lastDay = new Date(year, endMonth, 0).getDate();
      startDate = `${year}-${String(startMonth).padStart(2, "0")}-01`;
      endDate = `${year}-${String(endMonth).padStart(2, "0")}-${lastDay}`;
    } else {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    }

    // 1. 사용자 목록 조회
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, position")
      .eq("is_locked", false);

    if (usersError) throw usersError;

    // 2. 작업지시 담당자 완료 정보 조회
    const { data: workOrderAssignees, error: woaError } = await supabase
      .from("work_order_assignees")
      .select(`
        user_id,
        is_completed,
        completed_at,
        assigned_at,
        work_order:work_orders!work_order_assignees_work_order_id_fkey(
          id,
          deadline_end,
          status
        )
      `)
      .gte("assigned_at", startDate)
      .lte("assigned_at", `${endDate}T23:59:59`);

    if (woaError) throw woaError;

    // 3. 재고 작업 (입출고) 조회
    const { data: inventoryTasks, error: itError } = await supabase
      .from("inventory_tasks")
      .select("assigned_to, status, completed_at, expected_date")
      .not("assigned_to", "is", null)
      .gte("created_at", startDate)
      .lte("created_at", `${endDate}T23:59:59`);

    if (itError) throw itError;

    // 4. 생산 기록 조회
    const { data: productionRecords, error: prError } = await supabase
      .from("production_records")
      .select("created_by, production_date, quantity_produced")
      .eq("status", "completed")
      .gte("production_date", startDate)
      .lte("production_date", endDate);

    if (prError) throw prError;

    // 사용자별 집계
    const userStatsMap = new Map<string, {
      user_id: string;
      user_name: string;
      position: string;
      completed_count: number;
      on_time_count: number;
      total_processing_days: number;
      processing_count: number;
      inventory_completed: number;
      production_records: number;
      production_quantity: number;
    }>();

    // 초기화
    users?.forEach((user) => {
      userStatsMap.set(user.id, {
        user_id: user.id,
        user_name: user.name || "알 수 없음",
        position: user.position || "",
        completed_count: 0,
        on_time_count: 0,
        total_processing_days: 0,
        processing_count: 0,
        inventory_completed: 0,
        production_records: 0,
        production_quantity: 0,
      });
    });

    // 작업지시 집계
    (workOrderAssignees || []).forEach((woa: unknown) => {
      const assignee = woa as {
        user_id: string;
        is_completed: boolean;
        completed_at: string | null;
        assigned_at: string | null;
        work_order: { id: string; deadline_end: string | null; status: string } | null;
      };
      const userStats = userStatsMap.get(assignee.user_id);
      if (!userStats) return;

      if (assignee.is_completed) {
        userStats.completed_count += 1;

        // 납기 준수 여부 (deadline_end 이전에 완료)
        const workOrder = assignee.work_order;
        if (workOrder?.deadline_end && assignee.completed_at) {
          const deadlineDate = new Date(workOrder.deadline_end);
          const completedDate = new Date(assignee.completed_at);
          if (completedDate <= deadlineDate) {
            userStats.on_time_count += 1;
          }
        } else {
          // deadline이 없는 경우 납기 준수로 처리
          userStats.on_time_count += 1;
        }

        // 처리 시간 계산 (일 단위)
        if (assignee.assigned_at && assignee.completed_at) {
          const assignedDate = new Date(assignee.assigned_at);
          const completedDate = new Date(assignee.completed_at);
          const diffMs = completedDate.getTime() - assignedDate.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          userStats.total_processing_days += diffDays;
          userStats.processing_count += 1;
        }
      }
    });

    // 재고 작업 집계
    (inventoryTasks as InventoryTask[] || []).forEach((task) => {
      if (!task.assigned_to) return;
      const userStats = userStatsMap.get(task.assigned_to);
      if (!userStats) return;

      if (task.status === "completed") {
        userStats.inventory_completed += 1;
      }
    });

    // 생산 기록 집계
    (productionRecords as ProductionRecord[] || []).forEach((record) => {
      if (!record.created_by) return;
      const userStats = userStatsMap.get(record.created_by);
      if (!userStats) return;

      userStats.production_records += 1;
      userStats.production_quantity += record.quantity_produced || 0;
    });

    // 결과 변환
    const byUser = Array.from(userStatsMap.values())
      .filter((u) =>
        u.completed_count > 0 ||
        u.inventory_completed > 0 ||
        u.production_records > 0
      )
      .map((u) => ({
        user_id: u.user_id,
        user_name: u.user_name,
        position: u.position,
        completed_count: u.completed_count,
        on_time_rate: u.completed_count > 0
          ? Math.round((u.on_time_count / u.completed_count) * 100 * 10) / 10
          : 0,
        avg_processing_days: u.processing_count > 0
          ? Math.round((u.total_processing_days / u.processing_count) * 10) / 10
          : 0,
        inventory_completed: u.inventory_completed,
        production_records: u.production_records,
        production_quantity: u.production_quantity,
      }))
      .sort((a, b) => b.completed_count - a.completed_count);

    // 전체 요약
    const summary = {
      total_completed: byUser.reduce((sum, u) => sum + u.completed_count, 0),
      on_time_rate: byUser.length > 0
        ? Math.round(
            byUser.reduce((sum, u) => sum + u.on_time_rate * u.completed_count, 0) /
            Math.max(byUser.reduce((sum, u) => sum + u.completed_count, 0), 1) * 10
          ) / 10
        : 0,
      avg_processing_days: byUser.length > 0
        ? Math.round(
            byUser.filter(u => u.avg_processing_days > 0)
              .reduce((sum, u) => sum + u.avg_processing_days, 0) /
            Math.max(byUser.filter(u => u.avg_processing_days > 0).length, 1) * 10
          ) / 10
        : 0,
      inventory_tasks_completed: byUser.reduce((sum, u) => sum + u.inventory_completed, 0),
      production_records_count: byUser.reduce((sum, u) => sum + u.production_records, 0),
      production_quantity_total: byUser.reduce((sum, u) => sum + u.production_quantity, 0),
    };

    // 월별 추이 (연간 조회일 때만)
    let monthlyTrend: { month: string; completed: number; on_time: number }[] = [];

    if (!month) {
      // 월별로 재집계
      const monthlyMap = new Map<string, { completed: number; on_time: number }>();

      for (let m = 1; m <= 12; m++) {
        const monthKey = `${year}-${String(m).padStart(2, "0")}`;
        monthlyMap.set(monthKey, { completed: 0, on_time: 0 });
      }

      (workOrderAssignees || []).forEach((woa: unknown) => {
        const assignee = woa as {
          user_id: string;
          is_completed: boolean;
          completed_at: string | null;
          assigned_at: string | null;
          work_order: { id: string; deadline_end: string | null; status: string } | null;
        };
        if (!assignee.is_completed || !assignee.completed_at) return;

        const completedDate = new Date(assignee.completed_at);
        const monthKey = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, "0")}`;

        const monthData = monthlyMap.get(monthKey);
        if (monthData) {
          monthData.completed += 1;

          const workOrder = assignee.work_order;
          if (workOrder?.deadline_end) {
            const deadlineDate = new Date(workOrder.deadline_end);
            if (completedDate <= deadlineDate) {
              monthData.on_time += 1;
            }
          } else {
            monthData.on_time += 1;
          }
        }
      });

      monthlyTrend = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        completed: data.completed,
        on_time: data.on_time,
      }));
    }

    return NextResponse.json({
      summary,
      monthly_trend: monthlyTrend,
      by_user: byUser,
    });
  } catch (error) {
    console.error("생산팀 실적 조회 오류:", error);
    return NextResponse.json(
      { error: "생산팀 실적 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
