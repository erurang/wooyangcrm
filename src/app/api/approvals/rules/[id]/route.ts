import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 개별 결재 규칙 API
 * GET /api/approvals/rules/[id] - 규칙 상세 조회
 * PATCH /api/approvals/rules/[id] - 규칙 수정
 * DELETE /api/approvals/rules/[id] - 규칙 삭제
 */

// GET: 규칙 상세 조회
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("approval_rules")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "규칙을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ rule: data });
  } catch (error) {
    console.error("Error in GET /api/approvals/rules/[id]:", error);
    return NextResponse.json(
      { error: "규칙 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PATCH: 규칙 수정
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, conditions, action, priority, is_active } = body;

    // 유효한 액션인지 확인
    if (action) {
      const validActions = ["auto_approve", "skip_step", "notify_only"];
      if (!validActions.includes(action)) {
        return NextResponse.json(
          { error: "유효하지 않은 액션입니다." },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (conditions !== undefined) updateData.conditions = conditions;
    if (action !== undefined) updateData.action = action;
    if (priority !== undefined) updateData.priority = priority;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from("approval_rules")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "규칙이 수정되었습니다.",
      rule: data,
    });
  } catch (error) {
    console.error("Error in PATCH /api/approvals/rules/[id]:", error);
    return NextResponse.json(
      { error: "규칙 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 규칙 삭제
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from("approval_rules")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      message: "규칙이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error in DELETE /api/approvals/rules/[id]:", error);
    return NextResponse.json(
      { error: "규칙 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
