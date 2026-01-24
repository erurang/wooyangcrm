import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/manage/rnds/[id]/expenditures
 * 과제별 예산 집행 내역 조회
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;
    const year = searchParams.get("year");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    let query = supabase
      .from("rnd_expenditures")
      .select(`
        *,
        creator:users!rnd_expenditures_created_by_fkey(id, name),
        approver:users!rnd_expenditures_approved_by_fkey(id, name)
      `)
      .eq("rnd_id", id)
      .order("expenditure_date", { ascending: false });

    if (year) {
      query = query.eq("year", parseInt(year));
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (status) {
      query = query.eq("approval_status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 집계 정보도 함께 계산
    const summary = {
      total_amount: 0,
      approved_amount: 0,
      pending_amount: 0,
      rejected_amount: 0,
      by_category: {} as Record<string, number>,
    };

    (data || []).forEach((exp) => {
      const amount = Number(exp.amount) || 0;
      summary.total_amount += amount;

      if (exp.approval_status === "approved") {
        summary.approved_amount += amount;
      } else if (exp.approval_status === "pending") {
        summary.pending_amount += amount;
      } else if (exp.approval_status === "rejected") {
        summary.rejected_amount += amount;
      }

      if (!summary.by_category[exp.category]) {
        summary.by_category[exp.category] = 0;
      }
      if (exp.approval_status === "approved") {
        summary.by_category[exp.category] += amount;
      }
    });

    return NextResponse.json({ data, summary });
  } catch (error) {
    console.error("Error fetching expenditures:", error);
    return NextResponse.json(
      { error: "집행 내역 조회 실패" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manage/rnds/[id]/expenditures
 * 예산 집행 내역 추가
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      budget_id,
      year,
      category,
      expenditure_date,
      amount,
      description,
      vendor,
      evidence_type,
      evidence_number,
      file_url,
      created_by,
    } = body;

    if (!year || !category || !expenditure_date || !amount) {
      return NextResponse.json(
        { error: "연차, 비목, 집행일, 금액은 필수입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("rnd_expenditures")
      .insert([
        {
          rnd_id: id,
          budget_id,
          year,
          category,
          expenditure_date,
          amount,
          description,
          vendor,
          evidence_type,
          evidence_number,
          file_url,
          created_by,
          approval_status: "pending",
        },
      ])
      .select(`
        *,
        creator:users!rnd_expenditures_created_by_fkey(id, name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error adding expenditure:", error);
    return NextResponse.json(
      { error: "집행 내역 추가 실패" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/manage/rnds/[id]/expenditures
 * 예산 집행 내역 수정
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await params;
    const body = await req.json();
    const { expenditure_id, ...updateFields } = body;

    if (!expenditure_id) {
      return NextResponse.json(
        { error: "집행 내역 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const allowedFields = [
      "budget_id", "year", "category", "expenditure_date", "amount",
      "description", "vendor", "evidence_type", "evidence_number",
      "file_url", "approval_status", "approved_by",
    ];

    allowedFields.forEach((field) => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    const { data, error } = await supabase
      .from("rnd_expenditures")
      .update(updateData)
      .eq("id", expenditure_id)
      .select(`
        *,
        creator:users!rnd_expenditures_created_by_fkey(id, name),
        approver:users!rnd_expenditures_approved_by_fkey(id, name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error updating expenditure:", error);
    return NextResponse.json(
      { error: "집행 내역 수정 실패" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/manage/rnds/[id]/expenditures
 * 예산 집행 내역 삭제
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await params;
    const { searchParams } = req.nextUrl;
    const expenditureId = searchParams.get("expenditure_id");

    if (!expenditureId) {
      return NextResponse.json(
        { error: "집행 내역 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // pending 상태인 것만 삭제 가능
    const { data: existing } = await supabase
      .from("rnd_expenditures")
      .select("approval_status")
      .eq("id", expenditureId)
      .single();

    if (existing?.approval_status === "approved") {
      return NextResponse.json(
        { error: "승인된 집행 내역은 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("rnd_expenditures")
      .delete()
      .eq("id", expenditureId);

    if (error) throw error;

    return NextResponse.json({ message: "집행 내역이 삭제되었습니다." });
  } catch (error) {
    console.error("Error deleting expenditure:", error);
    return NextResponse.json(
      { error: "집행 내역 삭제 실패" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/manage/rnds/[id]/expenditures
 * 집행 내역 승인/반려 처리
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await params;
    const body = await req.json();
    const { expenditure_id, action, approved_by, rejection_reason } = body;

    if (!expenditure_id || !action) {
      return NextResponse.json(
        { error: "집행 내역 ID와 처리 유형이 필요합니다." },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "처리 유형은 approve 또는 reject만 가능합니다." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      approval_status: action === "approve" ? "approved" : "rejected",
      approved_by,
      updated_at: new Date().toISOString(),
    };

    if (rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const { data, error } = await supabase
      .from("rnd_expenditures")
      .update(updateData)
      .eq("id", expenditure_id)
      .select(`
        *,
        creator:users!rnd_expenditures_created_by_fkey(id, name),
        approver:users!rnd_expenditures_approved_by_fkey(id, name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      data,
      message: action === "approve" ? "승인되었습니다." : "반려되었습니다."
    });
  } catch (error) {
    console.error("Error processing expenditure:", error);
    return NextResponse.json(
      { error: "집행 내역 처리 실패" },
      { status: 500 }
    );
  }
}
