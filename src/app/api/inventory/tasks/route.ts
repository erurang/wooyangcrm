import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type {
  InventoryTaskFilters,
  InventoryTaskWithDetails,
} from "@/types/inventory";

// GET: 재고 작업 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const task_type = searchParams.get("task_type") as "inbound" | "outbound" | null;
    const status = searchParams.get("status") || "all";
    const company_id = searchParams.get("company_id");
    const assigned_to = searchParams.get("assigned_to");
    const date_from = searchParams.get("date_from");
    const date_to = searchParams.get("date_to");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const overdue = searchParams.get("overdue") === "true";

    let query = supabase
      .from("inventory_tasks")
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
      `,
        { count: "exact" }
      )
      .order("document_number", { ascending: false });

    // 필터 적용
    if (task_type) {
      query = query.eq("task_type", task_type);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // 지연 필터 (완료/취소 아니고, 예정일이 오늘 이전)
    if (overdue) {
      const today = new Date().toISOString().split("T")[0];
      query = query
        .not("status", "in", "(completed,canceled)")
        .lt("expected_date", today);
    }

    if (company_id) {
      query = query.eq("company_id", company_id);
    }

    if (assigned_to) {
      query = query.eq("assigned_to", assigned_to);
    }

    // 날짜 필터: document_number 형식이 WY-YYYYMMDD-XXXX 이므로 이를 활용
    if (date_from) {
      // WY-20250101 형태로 변환하여 비교
      const fromPrefix = `WY-${date_from.replace(/-/g, "")}`;
      query = query.gte("document_number", fromPrefix);
    }

    if (date_to) {
      // WY-20250131-9999 형태로 변환하여 해당 날짜까지 포함
      const toPrefix = `WY-${date_to.replace(/-/g, "")}-9999`;
      query = query.lte("document_number", toPrefix);
    }

    if (search) {
      query = query.or(
        `document_number.ilike.%${search}%,company.name.ilike.%${search}%`
      );
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`재고 작업 조회 실패: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      tasks: data || [],
      total: count || 0,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("재고 작업 조회 에러:", error);
    return NextResponse.json(
      { error: "재고 작업 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 새 재고 작업 생성 (문서 기반)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { document_id } = body;

    if (!document_id) {
      return NextResponse.json(
        { error: "document_id가 필요합니다" },
        { status: 400 }
      );
    }

    // 문서 정보 조회
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, document_number, type, company_id, delivery_date, status")
      .eq("id", document_id)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: "문서를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 문서 상태 확인
    if (document.status !== "completed") {
      return NextResponse.json(
        { error: "완료된 문서만 재고 작업을 생성할 수 있습니다" },
        { status: 400 }
      );
    }

    // 이미 존재하는지 확인
    const { data: existing } = await supabase
      .from("inventory_tasks")
      .select("id")
      .eq("document_id", document_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "이미 해당 문서에 대한 재고 작업이 존재합니다" },
        { status: 400 }
      );
    }

    // task_type 결정
    const task_type = document.type === "order" ? "inbound" : "outbound";

    // 생성 (assigned_by는 문서 완료 처리한 사람, assigned_to는 미배정)
    const { data, error } = await supabase
      .from("inventory_tasks")
      .insert({
        document_id: document.id,
        document_number: document.document_number,
        document_type: document.type,
        task_type,
        company_id: document.company_id,
        expected_date: document.delivery_date,
        status: "pending",
        assigned_by: body.user_id || null, // 지정자 = 문서 완료 처리한 사람
        // assigned_to는 null (담당자는 별도 배정)
      })
      .select()
      .single();

    if (error) {
      throw new Error(`재고 작업 생성 실패: ${error.message}`);
    }

    // 로그 기록
    await supabase.from("logs").insert({
      table_name: "inventory_tasks",
      operation: "INSERT",
      record_id: data.id,
      old_data: null,
      new_data: data,
      changed_by: body.user_id || null,
    });

    return NextResponse.json({
      message: "재고 작업이 생성되었습니다",
      task: data,
    });
  } catch (error) {
    console.error("재고 작업 생성 에러:", error);
    return NextResponse.json(
      { error: "재고 작업 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
