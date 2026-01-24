import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/manage/rnds/[id]/budgets
 * 과제별 예산 목록 조회
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("rnd_budgets")
      .select("*")
      .eq("rnd_id", id)
      .order("year", { ascending: true })
      .order("category", { ascending: true });

    if (error) throw error;

    // 연차별 집행 현황도 함께 조회
    const { data: expenditures, error: expError } = await supabase
      .from("rnd_expenditures")
      .select("year, category, amount, approval_status")
      .eq("rnd_id", id)
      .eq("approval_status", "approved");

    if (expError) {
      console.error("Error fetching expenditures:", expError);
    }

    // 집행 현황 집계
    const expenditureSummary: Record<string, Record<string, number>> = {};
    (expenditures || []).forEach((exp) => {
      const key = `${exp.year}-${exp.category}`;
      if (!expenditureSummary[exp.year]) {
        expenditureSummary[exp.year] = {};
      }
      if (!expenditureSummary[exp.year][exp.category]) {
        expenditureSummary[exp.year][exp.category] = 0;
      }
      expenditureSummary[exp.year][exp.category] += Number(exp.amount) || 0;
    });

    // 예산 데이터에 집행현황 추가
    const budgetsWithExpenditure = (data || []).map((budget) => ({
      ...budget,
      expenditure_total:
        expenditureSummary[budget.year]?.[budget.category] || 0,
      remaining:
        (Number(budget.gov_amount) || 0) +
        (Number(budget.private_amount) || 0) +
        (Number(budget.in_kind_amount) || 0) -
        (expenditureSummary[budget.year]?.[budget.category] || 0),
    }));

    return NextResponse.json({ data: budgetsWithExpenditure });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "예산 조회 실패" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manage/rnds/[id]/budgets
 * 예산 항목 추가
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { year, category, gov_amount, private_amount, in_kind_amount, notes } = body;

    if (!year || !category) {
      return NextResponse.json(
        { error: "연차와 비목은 필수입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("rnd_budgets")
      .insert([
        {
          rnd_id: id,
          year,
          category,
          gov_amount: gov_amount || 0,
          private_amount: private_amount || 0,
          in_kind_amount: in_kind_amount || 0,
          notes,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "해당 연차/비목의 예산이 이미 존재합니다." },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error adding budget:", error);
    return NextResponse.json(
      { error: "예산 추가 실패" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/manage/rnds/[id]/budgets
 * 예산 대량 업데이트 (연차별 비목 일괄 설정)
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { budgets } = body;

    if (!Array.isArray(budgets)) {
      return NextResponse.json(
        { error: "budgets 배열이 필요합니다." },
        { status: 400 }
      );
    }

    // 기존 예산 삭제 후 새로 삽입
    const { error: deleteError } = await supabase
      .from("rnd_budgets")
      .delete()
      .eq("rnd_id", id);

    if (deleteError) throw deleteError;

    if (budgets.length === 0) {
      return NextResponse.json({ data: [], message: "예산이 초기화되었습니다." });
    }

    const insertData = budgets.map((b) => ({
      rnd_id: id,
      year: b.year,
      category: b.category,
      gov_amount: b.gov_amount || 0,
      private_amount: b.private_amount || 0,
      in_kind_amount: b.in_kind_amount || 0,
      notes: b.notes,
    }));

    const { data, error } = await supabase
      .from("rnd_budgets")
      .insert(insertData)
      .select();

    if (error) throw error;

    return NextResponse.json({ data, message: "예산이 업데이트되었습니다." });
  } catch (error) {
    console.error("Error updating budgets:", error);
    return NextResponse.json(
      { error: "예산 업데이트 실패" },
      { status: 500 }
    );
  }
}
