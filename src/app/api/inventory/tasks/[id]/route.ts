import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 단일 재고 작업 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("inventory_tasks")
      .select(
        `
        *,
        document:documents!inventory_tasks_document_id_fkey (
          id, document_number, type, date, content, delivery_date, valid_until, total_amount, user_id
        ),
        company:companies!inventory_tasks_company_id_fkey (
          id, name
        ),
        assignee:users!inventory_tasks_assigned_to_fkey (
          id, name, level
        ),
        assigner:users!inventory_tasks_assigned_by_fkey (
          id, name, level
        ),
        completer:users!inventory_tasks_completed_by_fkey (
          id, name, level
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "재고 작업을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ task: data });
  } catch (error) {
    console.error("재고 작업 조회 에러:", error);
    return NextResponse.json(
      { error: "재고 작업 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 재고 작업 수정 (예정일, 메모, 상태 등)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { expected_date, notes, status, assigned_to, user_id } = body;

    // 기존 데이터 조회
    const { data: oldData, error: fetchError } = await supabase
      .from("inventory_tasks")
      .select("*, assignee:users!inventory_tasks_assigned_to_fkey(id, name)")
      .eq("id", id)
      .single();

    if (fetchError || !oldData) {
      return NextResponse.json(
        { error: "재고 작업을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {};
    const changedFields: string[] = [];

    if (expected_date !== undefined && expected_date !== oldData.expected_date) {
      updateData.expected_date = expected_date;
      changedFields.push("expected_date");
    }

    if (notes !== undefined && notes !== oldData.notes) {
      updateData.notes = notes;
      changedFields.push("notes");
    }

    if (status !== undefined && status !== oldData.status) {
      updateData.status = status;
      changedFields.push("status");

      // 완료 처리 시 completed_by, completed_at 설정
      if (status === "completed" && user_id) {
        updateData.completed_by = user_id;
        updateData.completed_at = new Date().toISOString();
      }
    }

    if (assigned_to !== undefined && assigned_to !== oldData.assigned_to) {
      updateData.assigned_to = assigned_to;
      updateData.assigned_by = user_id;
      updateData.assigned_at = new Date().toISOString();
      updateData.status = "assigned";
      changedFields.push("assigned_to");
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "변경 사항이 없습니다", task: oldData });
    }

    // 업데이트
    const { data, error } = await supabase
      .from("inventory_tasks")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        document:documents!inventory_tasks_document_id_fkey (
          id, document_number, type, date, content, delivery_date, valid_until, total_amount
        ),
        company:companies!inventory_tasks_company_id_fkey (
          id, name
        ),
        assignee:users!inventory_tasks_assigned_to_fkey (
          id, name, level
        ),
        assigner:users!inventory_tasks_assigned_by_fkey (
          id, name, level
        ),
        completer:users!inventory_tasks_completed_by_fkey (
          id, name, level
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`재고 작업 수정 실패: ${error.message}`);
    }

    // 로그 기록
    await supabase.from("logs").insert({
      table_name: "inventory_tasks",
      operation: "UPDATE",
      record_id: id,
      old_data: oldData,
      new_data: data,
      changed_by: user_id || null,
    });

    // 알림 생성 (담당자 변경 시)
    if (assigned_to && assigned_to !== oldData.assigned_to) {
      const taskTypeText = oldData.task_type === "inbound" ? "입고" : "출고";
      await supabase.from("notifications").insert({
        user_id: assigned_to,
        type: "inventory_assignment",
        title: `${taskTypeText} 작업 배정`,
        message: `${oldData.document_number} ${taskTypeText} 작업이 배정되었습니다.`,
        related_id: id,
        related_type: "inventory_task",
      });
    }

    // 알림 생성 (예정일 변경 시, 담당자에게)
    if (
      changedFields.includes("expected_date") &&
      oldData.assigned_to &&
      oldData.assigned_to !== user_id
    ) {
      const taskTypeText = oldData.task_type === "inbound" ? "입고" : "출고";
      await supabase.from("notifications").insert({
        user_id: oldData.assigned_to,
        type: "inventory_update",
        title: `${taskTypeText} 예정일 변경`,
        message: `${oldData.document_number} ${taskTypeText} 예정일이 ${expected_date}로 변경되었습니다.`,
        related_id: id,
        related_type: "inventory_task",
      });
    }

    return NextResponse.json({
      message: "재고 작업이 수정되었습니다",
      task: data,
    });
  } catch (error) {
    console.error("재고 작업 수정 에러:", error);
    return NextResponse.json(
      { error: "재고 작업 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 재고 작업 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    // 기존 데이터 조회
    const { data: oldData, error: fetchError } = await supabase
      .from("inventory_tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !oldData) {
      return NextResponse.json(
        { error: "재고 작업을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 삭제
    const { error } = await supabase
      .from("inventory_tasks")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`재고 작업 삭제 실패: ${error.message}`);
    }

    // 로그 기록
    await supabase.from("logs").insert({
      table_name: "inventory_tasks",
      operation: "DELETE",
      record_id: id,
      old_data: oldData,
      new_data: null,
      changed_by: user_id || null,
    });

    return NextResponse.json({ message: "재고 작업이 삭제되었습니다" });
  } catch (error) {
    console.error("재고 작업 삭제 에러:", error);
    return NextResponse.json(
      { error: "재고 작업 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
