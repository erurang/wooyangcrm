import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 재고 작업 통계 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const task_type = searchParams.get("task_type") as "inbound" | "outbound" | null;
    const date_from = searchParams.get("date_from");
    const date_to = searchParams.get("date_to");

    // 오늘 날짜 (지연 계산용)
    const today = new Date().toISOString().split("T")[0];

    // 날짜 필터 prefix 생성 (document_number 형식: WY-YYYYMMDD-XXXX)
    const fromPrefix = date_from ? `WY-${date_from.replace(/-/g, "")}` : null;
    const toPrefix = date_to ? `WY-${date_to.replace(/-/g, "")}-9999` : null;

    // 각 상태별 count 쿼리 (병렬 실행)
    const buildQuery = (status?: string, overdueFilter?: boolean) => {
      let query = supabase
        .from("inventory_tasks")
        .select("id", { count: "exact", head: true });

      if (task_type) {
        query = query.eq("task_type", task_type);
      }

      // 날짜 필터 (document_number 기준)
      if (fromPrefix) {
        query = query.gte("document_number", fromPrefix);
      }
      if (toPrefix) {
        query = query.lte("document_number", toPrefix);
      }

      if (status) {
        query = query.eq("status", status);
      }

      // 지연 필터: 완료/취소가 아니고 예정일이 오늘 이전
      if (overdueFilter) {
        query = query
          .not("status", "in", "(completed,canceled)")
          .lt("expected_date", today);
      }

      return query;
    };

    const [
      totalResult,
      pendingResult,
      assignedResult,
      completedResult,
      canceledResult,
      overdueResult,
    ] = await Promise.all([
      buildQuery(),
      buildQuery("pending"),
      buildQuery("assigned"),
      buildQuery("completed"),
      buildQuery("canceled"),
      buildQuery(undefined, true),
    ]);

    // 에러 체크
    const errors = [totalResult, pendingResult, assignedResult, completedResult, canceledResult, overdueResult]
      .filter(r => r.error)
      .map(r => r.error?.message);

    if (errors.length > 0) {
      throw new Error(`통계 조회 실패: ${errors.join(", ")}`);
    }

    const stats = {
      total: totalResult.count || 0,
      pending: pendingResult.count || 0,
      assigned: assignedResult.count || 0,
      completed: completedResult.count || 0,
      canceled: canceledResult.count || 0,
      overdue: overdueResult.count || 0,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("통계 조회 에러:", error);
    return NextResponse.json(
      { error: "통계 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
