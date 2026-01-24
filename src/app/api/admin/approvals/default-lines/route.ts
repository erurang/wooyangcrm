import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * 기본 결재선 설정 API
 * GET /api/admin/approvals/default-lines - 목록 조회
 * POST /api/admin/approvals/default-lines - 새 설정 추가
 */

// GET: 기본 결재선 목록 조회
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category_id");
    const teamId = searchParams.get("team_id");

    let query = supabase
      .from("default_approval_lines")
      .select(`
        *,
        category:approval_categories(id, name),
        team:teams(id, name),
        department:departments(id, name)
      `)
      .order("category_id", { ascending: true })
      .order("line_order", { ascending: true });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching default approval lines:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 카테고리별로 그룹화
    const groupedByCategory = (data || []).reduce((acc, line) => {
      const catId = line.category_id;
      if (!acc[catId]) {
        acc[catId] = {
          category: line.category,
          lines: [],
        };
      }
      acc[catId].lines.push({
        ...line,
        category: undefined, // 중복 제거
      });
      return acc;
    }, {} as Record<string, { category: { id: string; name: string }; lines: unknown[] }>);

    return NextResponse.json({
      data: data || [],
      grouped: Object.values(groupedByCategory),
    });
  } catch (error) {
    console.error("Error in GET /api/admin/approvals/default-lines:", error);
    return NextResponse.json(
      { error: "기본 결재선 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 새 기본 결재선 추가
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      category_id,
      team_id,
      department_id,
      approver_type,
      approver_value,
      line_type = "approval",
      line_order,
      is_required = true,
    } = body;

    // 필수 필드 검증
    if (!category_id || !approver_type || !approver_value) {
      return NextResponse.json(
        { error: "category_id, approver_type, approver_value는 필수입니다." },
        { status: 400 }
      );
    }

    // approver_type 유효성 검증
    if (!["position", "role", "user"].includes(approver_type)) {
      return NextResponse.json(
        { error: "approver_type은 position, role, user 중 하나여야 합니다." },
        { status: 400 }
      );
    }

    // line_type 유효성 검증
    if (!["approval", "review", "reference"].includes(line_type)) {
      return NextResponse.json(
        { error: "line_type은 approval, review, reference 중 하나여야 합니다." },
        { status: 400 }
      );
    }

    // line_order 자동 계산 (지정되지 않은 경우)
    let finalLineOrder = line_order;
    if (!finalLineOrder) {
      const { data: existingLines } = await supabase
        .from("default_approval_lines")
        .select("line_order")
        .eq("category_id", category_id)
        .eq("team_id", team_id || null)
        .eq("department_id", department_id || null)
        .order("line_order", { ascending: false })
        .limit(1);

      finalLineOrder = existingLines && existingLines.length > 0
        ? existingLines[0].line_order + 1
        : 1;
    }

    const { data, error } = await supabase
      .from("default_approval_lines")
      .insert({
        category_id,
        team_id: team_id || null,
        department_id: department_id || null,
        approver_type,
        approver_value,
        line_type,
        line_order: finalLineOrder,
        is_required,
      })
      .select(`
        *,
        category:approval_categories(id, name),
        team:teams(id, name),
        department:departments(id, name)
      `)
      .single();

    if (error) {
      console.error("Error creating default approval line:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "기본 결재선이 추가되었습니다.",
      data,
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/approvals/default-lines:", error);
    return NextResponse.json(
      { error: "기본 결재선 추가 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 전체 결재선 일괄 업데이트 (순서 변경 등)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { category_id, team_id, department_id, lines } = body;

    if (!category_id || !Array.isArray(lines)) {
      return NextResponse.json(
        { error: "category_id와 lines 배열은 필수입니다." },
        { status: 400 }
      );
    }

    // 기존 결재선 삭제
    const deleteQuery = supabase
      .from("default_approval_lines")
      .delete()
      .eq("category_id", category_id);

    if (team_id) {
      deleteQuery.eq("team_id", team_id);
    } else {
      deleteQuery.is("team_id", null);
    }

    if (department_id) {
      deleteQuery.eq("department_id", department_id);
    } else {
      deleteQuery.is("department_id", null);
    }

    await deleteQuery;

    // 새 결재선 삽입
    if (lines.length > 0) {
      const insertData = lines.map((line: {
        approver_type: string;
        approver_value: string;
        line_type?: string;
        line_order: number;
        is_required?: boolean;
      }) => ({
        category_id,
        team_id: team_id || null,
        department_id: department_id || null,
        approver_type: line.approver_type,
        approver_value: line.approver_value,
        line_type: line.line_type || "approval",
        line_order: line.line_order,
        is_required: line.is_required !== false,
      }));

      const { error: insertError } = await supabase
        .from("default_approval_lines")
        .insert(insertData);

      if (insertError) {
        console.error("Error inserting default approval lines:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: "기본 결재선이 업데이트되었습니다.",
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/approvals/default-lines:", error);
    return NextResponse.json(
      { error: "기본 결재선 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
