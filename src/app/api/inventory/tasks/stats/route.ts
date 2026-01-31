import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 재고 작업 통계 조회 (문서 기반 + 해외 상담 기반)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const task_type = searchParams.get("task_type") as "inbound" | "outbound" | null;
    const date_from = searchParams.get("date_from");
    const date_to = searchParams.get("date_to");
    const includeOverseas = searchParams.get("include_overseas") !== "false";

    // 오늘 날짜 (지연 계산용)
    const today = new Date().toISOString().split("T")[0];

    // 날짜 필터 prefix 생성 (document_number 형식: WY-YYYYMMDD-XXXX)
    const fromPrefix = date_from ? `WY-${date_from.replace(/-/g, "")}` : null;
    const toPrefix = date_to ? `WY-${date_to.replace(/-/g, "")}-9999` : null;

    // 1. 문서 기반 재고 작업 통계
    const buildDocumentQuery = (status?: string, overdueFilter?: boolean) => {
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
      buildDocumentQuery(),
      buildDocumentQuery("pending"),
      buildDocumentQuery("assigned"),
      buildDocumentQuery("completed"),
      buildDocumentQuery("canceled"),
      buildDocumentQuery(undefined, true),
    ]);

    // 에러 체크
    const errors = [totalResult, pendingResult, assignedResult, completedResult, canceledResult, overdueResult]
      .filter(r => r.error)
      .map(r => r.error?.message);

    if (errors.length > 0) {
      throw new Error(`통계 조회 실패: ${errors.join(", ")}`);
    }

    let stats = {
      total: totalResult.count || 0,
      pending: pendingResult.count || 0,
      assigned: assignedResult.count || 0,
      completed: completedResult.count || 0,
      canceled: canceledResult.count || 0,
      overdue: overdueResult.count || 0,
    };

    // 2. 해외 상담 통계 추가 (includeOverseas && task_type 지정된 경우)
    if (includeOverseas && task_type) {
      let overseasPending = 0;
      let overseasCompleted = 0;
      let overseasOverdue = 0;

      if (task_type === "inbound") {
        // 수입: in_transit 상태 → pending, arrived 상태 → completed
        const pendingQuery = supabase
          .from("consultations")
          .select("id", { count: "exact", head: true })
          .eq("order_type", "import")
          .in("trade_status", ["in_transit"]);

        const completedQuery = supabase
          .from("consultations")
          .select("id", { count: "exact", head: true })
          .eq("order_type", "import")
          .eq("trade_status", "arrived");

        // 지연: in_transit + arrival_date < today
        const overdueQuery = supabase
          .from("consultations")
          .select("id", { count: "exact", head: true })
          .eq("order_type", "import")
          .in("trade_status", ["in_transit"])
          .lt("arrival_date", today)
          .not("arrival_date", "is", null);

        const [pendingRes, completedRes, overdueRes] = await Promise.all([
          date_from ? pendingQuery.gte("arrival_date", date_from) : pendingQuery,
          date_from ? completedQuery.gte("arrival_date", date_from) : completedQuery,
          overdueQuery,
        ].map(async (q, i) => {
          if (i < 2 && date_to) {
            return (q as any).lte("arrival_date", date_to);
          }
          return q;
        }));

        overseasPending = pendingRes.count || 0;
        overseasCompleted = completedRes.count || 0;
        overseasOverdue = overdueRes.count || 0;
      } else {
        // 수출: expected_completion_date 있고 shipped 아닌 것 → pending, shipped → completed
        const pendingQuery = supabase
          .from("consultations")
          .select("id", { count: "exact", head: true })
          .eq("order_type", "export")
          .not("expected_completion_date", "is", null)
          .not("trade_status", "in", "(shipped,in_transit,arrived)");

        const completedQuery = supabase
          .from("consultations")
          .select("id", { count: "exact", head: true })
          .eq("order_type", "export")
          .eq("trade_status", "shipped");

        // 지연: expected_completion_date < today
        const overdueQuery = supabase
          .from("consultations")
          .select("id", { count: "exact", head: true })
          .eq("order_type", "export")
          .not("expected_completion_date", "is", null)
          .not("trade_status", "in", "(shipped,in_transit,arrived)")
          .lt("expected_completion_date", today);

        const [pendingRes, completedRes, overdueRes] = await Promise.all([
          pendingQuery,
          completedQuery,
          overdueQuery,
        ]);

        overseasPending = pendingRes.count || 0;
        overseasCompleted = completedRes.count || 0;
        overseasOverdue = overdueRes.count || 0;
      }

      // 통계 합산
      stats = {
        total: stats.total + overseasPending + overseasCompleted,
        pending: stats.pending + overseasPending,
        assigned: stats.assigned, // 해외 상담은 assigned 개념 없음
        completed: stats.completed + overseasCompleted,
        canceled: stats.canceled, // 해외 상담은 canceled 없음
        overdue: stats.overdue + overseasOverdue,
      };
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("통계 조회 에러:", error);
    return NextResponse.json(
      { error: "통계 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
