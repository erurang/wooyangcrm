import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export interface ApprovalRuleConditions {
  maxAmount?: number; // 최대 금액
  categoryId?: string; // 카테고리 ID
  requesterId?: string; // 특정 기안자 ID
}

export interface ApprovalRule {
  id: string;
  name: string;
  description: string | null;
  conditions: ApprovalRuleConditions;
  action: "auto_approve" | "skip_step" | "notify_only";
  priority: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

/**
 * 결재 자동화 규칙 API
 * GET /api/approvals/rules - 규칙 목록 조회
 * POST /api/approvals/rules - 새 규칙 생성
 */

// GET: 규칙 목록 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = supabase
      .from("approval_rules")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      rules: data || [],
    });
  } catch (error) {
    console.error("Error in GET /api/approvals/rules:", error);
    return NextResponse.json(
      { error: "규칙 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 새 규칙 생성
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, conditions, action, priority, is_active, created_by } = body;

    if (!name || !conditions || !action) {
      return NextResponse.json(
        { error: "규칙 이름, 조건, 액션은 필수입니다." },
        { status: 400 }
      );
    }

    // 유효한 액션인지 확인
    const validActions = ["auto_approve", "skip_step", "notify_only"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "유효하지 않은 액션입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("approval_rules")
      .insert({
        name,
        description: description || null,
        conditions,
        action,
        priority: priority || 0,
        is_active: is_active ?? true,
        created_by: created_by || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "규칙이 생성되었습니다.",
      rule: data,
    });
  } catch (error) {
    console.error("Error in POST /api/approvals/rules:", error);
    return NextResponse.json(
      { error: "규칙 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
