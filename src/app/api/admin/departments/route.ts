import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 부서 목록 조회
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("departments")
      .select(`
        *,
        teams (
          id,
          name,
          description,
          allowed_menus,
          sort_order,
          is_active
        )
      `)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("부서 목록 조회 실패:", error);
      return NextResponse.json(
        { error: "부서 목록을 불러오는데 실패했습니다" },
        { status: 500 }
      );
    }

    // 팀도 정렬
    const sortedData = data?.map((dept) => ({
      ...dept,
      teams: dept.teams?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order),
    }));

    return NextResponse.json(sortedData);
  } catch (error) {
    console.error("부서 목록 조회 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 부서 생성
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, sort_order } = body;

    if (!name) {
      return NextResponse.json(
        { error: "부서명을 입력해주세요" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("departments")
      .insert({
        name,
        description: description || null,
        sort_order: sort_order || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "이미 존재하는 부서명입니다" },
          { status: 400 }
        );
      }
      console.error("부서 생성 실패:", error);
      return NextResponse.json(
        { error: "부서 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("부서 생성 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PUT: 부서 수정
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "부서 ID가 필요합니다" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("departments")
      .update({
        name,
        description,
        sort_order,
        is_active,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "이미 존재하는 부서명입니다" },
          { status: 400 }
        );
      }
      console.error("부서 수정 실패:", error);
      return NextResponse.json(
        { error: "부서 수정에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("부서 수정 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 부서 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "부서 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 해당 부서에 팀이 있는지 확인
    const { data: teams } = await supabase
      .from("teams")
      .select("id")
      .eq("department_id", id);

    if (teams && teams.length > 0) {
      return NextResponse.json(
        { error: "해당 부서에 소속된 팀이 있어 삭제할 수 없습니다" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("부서 삭제 실패:", error);
      return NextResponse.json(
        { error: "부서 삭제에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("부서 삭제 에러:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
