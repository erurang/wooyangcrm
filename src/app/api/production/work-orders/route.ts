import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { CreateWorkOrderRequest, WorkOrderStatus } from "@/types/production";

// GET: 작업지시 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as WorkOrderStatus | null;
    const requester_id = searchParams.get("requester_id");
    const assignee_id = searchParams.get("assignee_id");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    let query = supabase
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
          user:users!work_order_assignees_user_id_fkey(id, name)
        )
      `)
      .order("created_at", { ascending: false });

    // 상태 필터
    if (status) {
      query = query.eq("status", status);
    }

    // 요청자 필터
    if (requester_id) {
      query = query.eq("requester_id", requester_id);
    }

    // 담당자 필터 (assignee가 있는 work_order만)
    if (assignee_id) {
      // 먼저 해당 담당자가 할당된 work_order_id 목록 조회
      const { data: assignedIds } = await supabase
        .from("work_order_assignees")
        .select("work_order_id")
        .eq("user_id", assignee_id);

      if (assignedIds && assignedIds.length > 0) {
        query = query.in("id", assignedIds.map(a => a.work_order_id));
      } else {
        return NextResponse.json({ workOrders: [], total: 0 });
      }
    }

    // 검색어 필터
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      workOrders: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("작업지시 조회 오류:", error);
    return NextResponse.json(
      { error: "작업지시 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 작업지시 생성
export async function POST(request: Request) {
  try {
    const body: CreateWorkOrderRequest = await request.json();
    const {
      title,
      content,
      deadline_type,
      deadline_start,
      deadline_end,
      requester_id,
      completion_type,
      completion_threshold,
      assignee_ids,
    } = body;

    if (!title || !requester_id) {
      return NextResponse.json(
        { error: "제목과 요청자는 필수입니다" },
        { status: 400 }
      );
    }

    // 작업지시 생성
    const { data: workOrder, error: workOrderError } = await supabase
      .from("work_orders")
      .insert([
        {
          title,
          content: content || null,
          deadline_type: deadline_type || "none",
          deadline_start: deadline_start || null,
          deadline_end: deadline_end || null,
          requester_id,
          completion_type: completion_type || "any",
          completion_threshold: completion_threshold || 1,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (workOrderError) throw workOrderError;

    // 담당자 할당
    if (assignee_ids && assignee_ids.length > 0) {
      const assignees = assignee_ids.map((userId) => ({
        work_order_id: workOrder.id,
        user_id: userId,
        assigned_by: requester_id,
      }));

      const { error: assigneeError } = await supabase
        .from("work_order_assignees")
        .insert(assignees);

      if (assigneeError) throw assigneeError;
    }

    // 활동 로그 기록
    await supabase.from("work_order_logs").insert([
      {
        work_order_id: workOrder.id,
        user_id: requester_id,
        action: "created",
        new_data: { title, content, deadline_type, completion_type, assignee_ids },
        description: `작업지시 "${title}" 생성됨`,
      },
    ]);

    return NextResponse.json({
      message: "작업지시가 생성되었습니다",
      workOrder,
    });
  } catch (error) {
    console.error("작업지시 생성 오류:", error);
    return NextResponse.json(
      { error: "작업지시 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
