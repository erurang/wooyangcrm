import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { UpdateWorkOrderRequest } from "@/types/production";

// GET: 작업지시 상세 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("work_orders")
      .select(`
        *,
        requester:users!work_orders_requester_id_fkey(id, name),
        assignees:work_order_assignees(
          id,
          user_id,
          is_completed,
          completed_at,
          assigned_at,
          assigned_by,
          user:users!work_order_assignees_user_id_fkey(id, name)
        ),
        files:work_order_files(
          id,
          file_url,
          file_name,
          file_size,
          created_at,
          user:users!work_order_files_user_id_fkey(id, name)
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "작업지시를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ workOrder: data });
  } catch (error) {
    console.error("작업지시 조회 오류:", error);
    return NextResponse.json(
      { error: "작업지시 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 작업지시 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateWorkOrderRequest & { user_id?: string } = await request.json();
    const { user_id, ...updates } = body;

    // 기존 데이터 조회
    const { data: oldData, error: fetchError } = await supabase
      .from("work_orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !oldData) {
      return NextResponse.json(
        { error: "작업지시를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 업데이트 데이터 준비
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.deadline_type !== undefined) updateData.deadline_type = updates.deadline_type;
    if (updates.deadline_start !== undefined) updateData.deadline_start = updates.deadline_start;
    if (updates.deadline_end !== undefined) updateData.deadline_end = updates.deadline_end;
    if (updates.completion_type !== undefined) updateData.completion_type = updates.completion_type;
    if (updates.completion_threshold !== undefined) updateData.completion_threshold = updates.completion_threshold;
    if ((body as any).requester_id !== undefined) updateData.requester_id = (body as any).requester_id;

    // 상태 변경 처리
    if (updates.status !== undefined) {
      updateData.status = updates.status;

      if (updates.status === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else if (updates.status === "canceled") {
        updateData.canceled_at = new Date().toISOString();
        updateData.canceled_by = user_id || null;
        if (updates.cancel_reason) {
          updateData.cancel_reason = updates.cancel_reason;
        }
      }
    }

    const { data, error } = await supabase
      .from("work_orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // 활동 로그 기록
    const action = updates.status ? "status_changed" : "edited";
    await supabase.from("work_order_logs").insert([
      {
        work_order_id: id,
        user_id: user_id || null,
        action,
        old_data: oldData,
        new_data: data,
        description: updates.status
          ? `상태가 "${oldData.status}"에서 "${updates.status}"로 변경됨`
          : `작업지시 수정됨`,
      },
    ]);

    // 알림 발송
    const { data: assignees } = await supabase
      .from("work_order_assignees")
      .select("user_id")
      .eq("work_order_id", id);

    const notificationTargets = new Set<string>();

    // 지시자 추가 (변경자 제외)
    if (oldData.requester_id && oldData.requester_id !== user_id) {
      notificationTargets.add(oldData.requester_id);
    }

    // 담당자들 추가 (변경자 제외)
    assignees?.forEach((a) => {
      if (a.user_id !== user_id) {
        notificationTargets.add(a.user_id);
      }
    });

    if (notificationTargets.size > 0) {
      const { data: updater } = await supabase
        .from("users")
        .select("name")
        .eq("id", user_id)
        .single();

      const updaterName = updater?.name || "알 수 없음";

      // 변경 유형에 따른 메시지
      let notificationType = "work_order_update";
      let notificationTitle = "작업지시 수정";
      let notificationMessage = `${updaterName}님이 "${oldData.title}" 작업지시를 수정했습니다.`;

      // 날짜 포맷 헬퍼
      const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "미정";
        return new Date(dateStr).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      };

      if (updates.status) {
        notificationType = "work_order_status";
        notificationTitle = "작업지시 상태 변경";
        const statusLabels: Record<string, string> = {
          pending: "대기",
          in_progress: "진행중",
          completed: "완료",
          canceled: "취소됨",
        };
        const oldStatusLabel = statusLabels[oldData.status] || oldData.status;
        const newStatusLabel = statusLabels[updates.status] || updates.status;
        notificationMessage = `${updaterName}님이 "${oldData.title}" 작업지시 상태를 변경했습니다.\n• 상태: ${oldStatusLabel} → ${newStatusLabel}`;

        if (updates.status === "canceled" && updates.cancel_reason) {
          notificationMessage += `\n• 취소 사유: ${updates.cancel_reason}`;
        }
      } else if (updates.deadline_start !== undefined || updates.deadline_end !== undefined) {
        notificationType = "work_order_deadline";
        notificationTitle = "작업지시 기한 변경";
        const oldStart = formatDate(oldData.deadline_start);
        const oldEnd = formatDate(oldData.deadline_end);
        const newStart = updates.deadline_start !== undefined ? formatDate(updates.deadline_start) : oldStart;
        const newEnd = updates.deadline_end !== undefined ? formatDate(updates.deadline_end) : oldEnd;
        notificationMessage = `${updaterName}님이 "${oldData.title}" 작업지시의 기한을 변경했습니다.\n• 시작일: ${oldStart} → ${newStart}\n• 종료일: ${oldEnd} → ${newEnd}`;
      } else {
        // 일반 수정 시 변경 내용 상세 표시
        const changes: string[] = [];
        if (updates.title !== undefined && updates.title !== oldData.title) {
          changes.push(`• 제목: "${oldData.title}" → "${updates.title}"`);
        }
        if (updates.content !== undefined && updates.content !== oldData.content) {
          changes.push(`• 내용이 수정되었습니다`);
        }
        if (updates.deadline_type !== undefined && updates.deadline_type !== oldData.deadline_type) {
          const typeLabels: Record<string, string> = {
            single: "특정일",
            range: "기간",
            none: "없음",
          };
          changes.push(`• 기한 유형: ${typeLabels[oldData.deadline_type] || oldData.deadline_type} → ${typeLabels[updates.deadline_type] || updates.deadline_type}`);
        }
        if (updates.completion_type !== undefined && updates.completion_type !== oldData.completion_type) {
          const completionLabels: Record<string, string> = {
            all: "전원 완료",
            any: "1인 완료",
            threshold: "최소 인원",
          };
          changes.push(`• 완료 조건: ${completionLabels[oldData.completion_type] || oldData.completion_type} → ${completionLabels[updates.completion_type] || updates.completion_type}`);
        }

        if (changes.length > 0) {
          notificationMessage = `${updaterName}님이 "${oldData.title}" 작업지시를 수정했습니다.\n${changes.join("\n")}`;
        }
      }

      const notifications = Array.from(notificationTargets).map((targetUserId) => ({
        user_id: targetUserId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        related_id: id,
        related_type: "work_order",
        read: false,
      }));

      await supabase.from("notifications").insert(notifications);
    }

    return NextResponse.json({
      message: "작업지시가 수정되었습니다",
      workOrder: data,
    });
  } catch (error) {
    console.error("작업지시 수정 오류:", error);
    return NextResponse.json(
      { error: "작업지시 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 작업지시 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from("work_orders")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "작업지시가 삭제되었습니다" });
  } catch (error) {
    console.error("작업지시 삭제 오류:", error);
    return NextResponse.json(
      { error: "작업지시 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
