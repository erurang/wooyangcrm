import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type {
  InventoryTaskFilters,
  InventoryTaskWithDetails,
} from "@/types/inventory";

// 해외 상담을 inventory task 형태로 변환
function transformOverseasConsultation(
  consultation: any,
  taskType: "inbound" | "outbound"
): InventoryTaskWithDetails {
  // 수입: 입고예정일, 수출: 출고예정일 사용
  const expectedDate =
    taskType === "inbound"
      ? consultation.arrival_date
      : consultation.pickup_date;

  // 상태 결정: arrived면 completed, 그 외는 pending
  let status: "pending" | "completed" = "pending";
  if (taskType === "inbound" && consultation.trade_status === "arrived") {
    status = "completed";
  } else if (taskType === "outbound" && consultation.trade_status === "shipped") {
    status = "completed";
  }

  return {
    id: `overseas-${consultation.id}`,
    document_id: "", // 해외 상담은 document_id 없음
    document_number: consultation.oc_number || `OC-${consultation.id.slice(0, 8).toUpperCase()}`,
    document_type: taskType === "inbound" ? "order" : "estimate",
    task_type: taskType,
    company_id: consultation.overseas_company_id || "",
    expected_date: expectedDate,
    status,
    assigned_to: null,
    assigned_by: null,
    assigned_at: null,
    completed_by: null,
    completed_at: status === "completed" ? consultation.updated_at : null,
    notes: null,
    created_at: consultation.created_at,
    updated_at: consultation.updated_at,
    // 추가 필드
    source: "overseas",
    consultation_id: consultation.id,
    consultation: {
      id: consultation.id,
      date: consultation.date,
      content: consultation.content,
      order_type: consultation.order_type,
      trade_status: consultation.trade_status,
      order_date: consultation.order_date,
      expected_completion_date: consultation.expected_completion_date,
      pickup_date: consultation.pickup_date,
      arrival_date: consultation.arrival_date,
      oc_number: consultation.oc_number,
      overseas_company: consultation.overseas_company,
    },
    overseas_company: consultation.overseas_company,
  };
}

// GET: 재고 작업 목록 조회 (문서 기반 + 해외 상담 기반)
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
    // 해외 상담 포함 여부 (기본: true)
    const includeOverseas = searchParams.get("include_overseas") !== "false";

    // 1. 기존 문서 기반 재고 작업 조회
    let query = supabase
      .from("inventory_tasks")
      .select(
        `
        *,
        document:documents!inventory_tasks_document_id_fkey (
          id, document_number, type, date, content, delivery_date, valid_until, total_amount,
          items:document_items (
            id, item_number, name, spec, quantity, unit, unit_price, amount, product_id
          )
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

    const { data: documentTasks, error: docError, count: docCount } = await query;

    if (docError) {
      throw new Error(`재고 작업 조회 실패: ${docError.message}`);
    }

    // source 필드 추가
    const documentTasksWithSource = (documentTasks || []).map((task) => ({
      ...task,
      source: "document" as const,
    }));

    // 2. 해외 상담 기반 작업 조회 (task_type이 지정되고 includeOverseas가 true인 경우)
    let overseasTasks: InventoryTaskWithDetails[] = [];
    let overseasCount = 0;

    if (includeOverseas && task_type && !assigned_to) {
      // 해외 상담 조회 조건
      // inbound: order_type="import" AND trade_status IN ("in_transit") - 운송중 상태
      // outbound: order_type="export" AND expected_completion_date IS NOT NULL AND trade_status NOT IN ("shipped", "in_transit", "arrived")

      let overseasQuery = supabase
        .from("consultations")
        .select(
          `
          id, date, content, created_at, updated_at,
          order_type, trade_status, order_date, expected_completion_date,
          pickup_date, arrival_date, oc_number, overseas_company_id,
          overseas_company:overseas_companies!consultations_overseas_company_id_fkey (
            id, name
          )
        `,
          { count: "exact" }
        );

      if (task_type === "inbound") {
        // 수입: 운송중 상태인 것들
        overseasQuery = overseasQuery
          .eq("order_type", "import")
          .in("trade_status", ["in_transit"]);
      } else {
        // 수출: 생산완료예정일이 있고 아직 출고 안 된 것들
        overseasQuery = overseasQuery
          .eq("order_type", "export")
          .not("expected_completion_date", "is", null)
          .not("trade_status", "in", "(shipped,in_transit,arrived)");
      }

      // 날짜 필터
      if (date_from) {
        if (task_type === "inbound") {
          overseasQuery = overseasQuery.gte("arrival_date", date_from);
        } else {
          overseasQuery = overseasQuery.gte("expected_completion_date", date_from);
        }
      }

      if (date_to) {
        if (task_type === "inbound") {
          overseasQuery = overseasQuery.lte("arrival_date", date_to);
        } else {
          overseasQuery = overseasQuery.lte("expected_completion_date", date_to);
        }
      }

      // 검색
      if (search) {
        overseasQuery = overseasQuery.or(
          `oc_number.ilike.%${search}%,content.ilike.%${search}%`
        );
      }

      // 상태 필터
      if (status === "completed") {
        if (task_type === "inbound") {
          overseasQuery = overseasQuery.eq("trade_status", "arrived");
        } else {
          overseasQuery = overseasQuery.eq("trade_status", "shipped");
        }
      } else if (status === "pending") {
        // 완료되지 않은 것만
        if (task_type === "inbound") {
          overseasQuery = overseasQuery.neq("trade_status", "arrived");
        } else {
          overseasQuery = overseasQuery.neq("trade_status", "shipped");
        }
      }

      overseasQuery = overseasQuery.order("created_at", { ascending: false });

      const { data: overseasData, error: overseasError, count: overseasCountResult } = await overseasQuery;

      if (!overseasError && overseasData) {
        overseasTasks = overseasData.map((c) =>
          transformOverseasConsultation(c, task_type)
        );
        overseasCount = overseasCountResult || 0;
      }
    }

    // 3. 병합 및 정렬
    const allTasks = [...documentTasksWithSource, ...overseasTasks];

    // expected_date 기준으로 내림차순 정렬
    allTasks.sort((a, b) => {
      const dateA = a.expected_date || a.created_at;
      const dateB = b.expected_date || b.created_at;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    // 페이지네이션 (클라이언트 사이드)
    const totalCount = (docCount || 0) + overseasCount;
    const from = (page - 1) * limit;
    const paginatedTasks = allTasks.slice(from, from + limit);
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      tasks: paginatedTasks,
      total: totalCount,
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
