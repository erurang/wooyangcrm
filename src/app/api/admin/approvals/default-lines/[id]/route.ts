import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 개별 기본 결재선 API
 * GET /api/admin/approvals/default-lines/[id] - 상세 조회
 * PATCH /api/admin/approvals/default-lines/[id] - 수정
 * DELETE /api/admin/approvals/default-lines/[id] - 삭제
 */

// GET: 개별 결재선 조회
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("default_approval_lines")
      .select(`
        *,
        category:approval_categories(id, name),
        team:teams(id, name),
        department:departments(id, name)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching default approval line:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "결재선 설정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in GET /api/admin/approvals/default-lines/[id]:", error);
    return NextResponse.json(
      { error: "결재선 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PATCH: 결재선 수정
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      approver_type,
      approver_value,
      line_type,
      line_order,
      is_required,
    } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (approver_type !== undefined) {
      if (!["position", "role", "user"].includes(approver_type)) {
        return NextResponse.json(
          { error: "approver_type은 position, role, user 중 하나여야 합니다." },
          { status: 400 }
        );
      }
      updateData.approver_type = approver_type;
    }

    if (approver_value !== undefined) {
      updateData.approver_value = approver_value;
    }

    if (line_type !== undefined) {
      if (!["approval", "review", "reference"].includes(line_type)) {
        return NextResponse.json(
          { error: "line_type은 approval, review, reference 중 하나여야 합니다." },
          { status: 400 }
        );
      }
      updateData.line_type = line_type;
    }

    if (line_order !== undefined) {
      updateData.line_order = line_order;
    }

    if (is_required !== undefined) {
      updateData.is_required = is_required;
    }

    const { data, error } = await supabase
      .from("default_approval_lines")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        category:approval_categories(id, name),
        team:teams(id, name),
        department:departments(id, name)
      `)
      .single();

    if (error) {
      console.error("Error updating default approval line:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "결재선 설정이 수정되었습니다.",
      data,
    });
  } catch (error) {
    console.error("Error in PATCH /api/admin/approvals/default-lines/[id]:", error);
    return NextResponse.json(
      { error: "결재선 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 결재선 삭제
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from("default_approval_lines")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting default approval line:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "결재선 설정이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/approvals/default-lines/[id]:", error);
    return NextResponse.json(
      { error: "결재선 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
