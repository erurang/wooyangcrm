import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 팀 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    let query = supabase
      .from("teams")
      .select(`
        *,
        department:departments (
          id,
          name
        )
      `)
      .order("sort_order", { ascending: true });

    if (departmentId) {
      query = query.eq("department_id", departmentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("팀 목록 조회 실패:", error);
      return NextResponse.json(
        { error: "팀 목록을 불러오는데 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("팀 목록 조회 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 팀 생성
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { department_id, name, description, allowed_menus, sort_order } = body;

    if (!department_id) {
      return NextResponse.json(
        { error: "부서를 선택해주세요" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "팀명을 입력해주세요" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("teams")
      .insert({
        department_id,
        name,
        description: description || null,
        allowed_menus: allowed_menus || ["dashboard", "board"],
        sort_order: sort_order || 0,
        is_active: true,
      })
      .select(`
        *,
        department:departments (
          id,
          name
        )
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "해당 부서에 이미 존재하는 팀명입니다" },
          { status: 400 }
        );
      }
      console.error("팀 생성 실패:", error);
      return NextResponse.json(
        { error: "팀 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("팀 생성 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PUT: 팀 수정
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, department_id, name, description, allowed_menus, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "팀 ID가 필요합니다" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("teams")
      .update({
        department_id,
        name,
        description,
        allowed_menus,
        sort_order,
        is_active,
      })
      .eq("id", id)
      .select(`
        *,
        department:departments (
          id,
          name
        )
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "해당 부서에 이미 존재하는 팀명입니다" },
          { status: 400 }
        );
      }
      console.error("팀 수정 실패:", error);
      return NextResponse.json(
        { error: "팀 수정에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("팀 수정 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 팀 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "팀 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 해당 팀에 소속된 사용자가 있는지 확인
    const { data: users } = await supabase
      .from("users")
      .select("id")
      .eq("team_id", id);

    if (users && users.length > 0) {
      return NextResponse.json(
        { error: "해당 팀에 소속된 직원이 있어 삭제할 수 없습니다" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("팀 삭제 실패:", error);
      return NextResponse.json(
        { error: "팀 삭제에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("팀 삭제 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
