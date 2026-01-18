import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// PATCH: 담당자 완료 처리
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 담당자 완료 처리
    const { data: assignee, error: assigneeError } = await supabase
      .from("work_order_assignees")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("work_order_id", id)
      .eq("user_id", user_id)
      .select(`
        *,
        user:users(id, name)
      `)
      .single();

    if (assigneeError) throw assigneeError;

    // 작업지시 정보 조회
    const { data: workOrder, error: workOrderError } = await supabase
      .from("work_orders")
      .select(`
        *,
        assignees:work_order_assignees(id, user_id, is_completed)
      `)
      .eq("id", id)
      .single();

    if (workOrderError) throw workOrderError;

    // 완료 조건 확인
    const completedCount = workOrder.assignees.filter((a: { is_completed: boolean }) => a.is_completed).length;
    const totalAssignees = workOrder.assignees.length;
    let shouldComplete = false;

    switch (workOrder.completion_type) {
      case "any":
        // 한 명이라도 완료하면 전체 완료
        shouldComplete = completedCount >= 1;
        break;
      case "all":
        // 모든 담당자가 완료해야 전체 완료
        shouldComplete = completedCount === totalAssignees;
        break;
      case "threshold":
        // 임계값 이상 완료해야 전체 완료
        shouldComplete = completedCount >= (workOrder.completion_threshold || 1);
        break;
    }

    // 전체 완료 처리
    if (shouldComplete && workOrder.status !== "completed") {
      await supabase
        .from("work_orders")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    }

    // 활동 로그 기록
    await supabase.from("work_order_logs").insert([
      {
        work_order_id: id,
        user_id,
        action: "assignee_completed",
        new_data: { completed_by: user_id, completed_count: completedCount, total: totalAssignees },
        description: `${assignee.user?.name || user_id}님이 작업을 완료함 (${completedCount}/${totalAssignees})`,
      },
    ]);

    // 알림 발송
    const notificationTargets = new Set<string>();

    // 지시자 추가 (완료자 제외)
    if (workOrder.requester_id && workOrder.requester_id !== user_id) {
      notificationTargets.add(workOrder.requester_id);
    }

    // 다른 담당자들 추가 (완료자 제외)
    workOrder.assignees?.forEach((a: { user_id: string }) => {
      if (a.user_id !== user_id) {
        notificationTargets.add(a.user_id);
      }
    });

    if (notificationTargets.size > 0) {
      const completedUserName = assignee.user?.name || "담당자";
      const notificationTitle = shouldComplete ? "작업지시 완료" : "작업지시 진행 상황";
      const notificationMessage = shouldComplete
        ? `"${workOrder.title}" 작업이 완료되었습니다.`
        : `${completedUserName}님이 "${workOrder.title}" 작업을 완료했습니다. (${completedCount}/${totalAssignees})`;

      const notifications = Array.from(notificationTargets).map((targetUserId) => ({
        user_id: targetUserId,
        type: shouldComplete ? "work_order_completed" : "work_order_progress",
        title: notificationTitle,
        message: notificationMessage,
        related_id: id,
        related_type: "work_order",
        read: false,
      }));

      await supabase.from("notifications").insert(notifications);
    }

    return NextResponse.json({
      message: "작업이 완료 처리되었습니다",
      assignee,
      workOrderCompleted: shouldComplete,
      progress: {
        completed: completedCount,
        total: totalAssignees,
      },
    });
  } catch (error) {
    console.error("완료 처리 오류:", error);
    return NextResponse.json(
      { error: "완료 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
