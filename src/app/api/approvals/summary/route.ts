import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * 결재 대시보드 요약 정보 조회
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id가 필요합니다." },
        { status: 400 }
      );
    }

    // 이번 달 시작일
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthISO = startOfMonth.toISOString();

    // 1. 내가 결재할 문서 수 (pending 상태에서 내 차례인 것)
    const { data: pendingLines } = await supabase
      .from("approval_lines")
      .select(
        `
        request_id,
        request:approval_requests!inner(id, status, current_line_order)
      `
      )
      .eq("approver_id", user_id)
      .eq("status", "pending");

    // 실제로 내 차례인 것만 필터링
    const pendingCount =
      pendingLines?.filter((line) => {
        const request = line.request as unknown as {
          status: string;
          current_line_order: number;
        };
        const lineData = line as unknown as { line_order: number };
        return (
          request?.status === "pending" &&
          request?.current_line_order === lineData.line_order
        );
      }).length || 0;

    // 2. 내가 기안한 진행 중 문서 수
    const { count: requestedCount } = await supabase
      .from("approval_requests")
      .select("id", { count: "exact", head: true })
      .eq("requester_id", user_id)
      .eq("status", "pending");

    // 3. 이번 달 승인된 문서 수 (내가 기안한 것)
    const { count: approvedCount } = await supabase
      .from("approval_requests")
      .select("id", { count: "exact", head: true })
      .eq("requester_id", user_id)
      .eq("status", "approved")
      .gte("completed_at", startOfMonthISO);

    // 4. 이번 달 반려된 문서 수 (내가 기안한 것)
    const { count: rejectedCount } = await supabase
      .from("approval_requests")
      .select("id", { count: "exact", head: true })
      .eq("requester_id", user_id)
      .eq("status", "rejected")
      .gte("completed_at", startOfMonthISO);

    // 5. 임시저장 문서 수
    const { count: draftCount } = await supabase
      .from("approval_requests")
      .select("id", { count: "exact", head: true })
      .eq("requester_id", user_id)
      .eq("status", "draft");

    return NextResponse.json({
      pending_count: pendingCount,
      requested_count: requestedCount || 0,
      approved_count: approvedCount || 0,
      rejected_count: rejectedCount || 0,
      draft_count: draftCount || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/approvals/summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch approval summary" },
      { status: 500 }
    );
  }
}
