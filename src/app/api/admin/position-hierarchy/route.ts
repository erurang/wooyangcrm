import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * 직급 체계 관리 API
 * GET /api/admin/position-hierarchy - 직급 목록 조회
 * POST /api/admin/position-hierarchy - 새 직급 추가
 * PUT /api/admin/position-hierarchy - 직급 순서 일괄 업데이트
 */

// GET: 직급 목록 조회
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("position_hierarchy")
      .select("*")
      .order("hierarchy_level", { ascending: true });

    if (error) {
      console.error("Error fetching position hierarchy:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      positions: data || [],
    });
  } catch (error) {
    console.error("Error in GET /api/admin/position-hierarchy:", error);
    return NextResponse.json(
      { error: "직급 체계 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 새 직급 추가
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { position_name, hierarchy_level } = body;

    if (!position_name || hierarchy_level === undefined) {
      return NextResponse.json(
        { error: "position_name과 hierarchy_level은 필수입니다." },
        { status: 400 }
      );
    }

    // 중복 체크
    const { data: existing } = await supabase
      .from("position_hierarchy")
      .select("id")
      .eq("position_name", position_name)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "이미 존재하는 직급명입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("position_hierarchy")
      .insert({
        position_name,
        hierarchy_level,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating position:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "직급이 추가되었습니다.",
      position: data,
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/position-hierarchy:", error);
    return NextResponse.json(
      { error: "직급 추가 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 직급 순서 일괄 업데이트
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { positions } = body;

    if (!Array.isArray(positions)) {
      return NextResponse.json(
        { error: "positions 배열은 필수입니다." },
        { status: 400 }
      );
    }

    // 각 직급의 hierarchy_level 업데이트
    for (const pos of positions) {
      if (pos.id && pos.hierarchy_level !== undefined) {
        const { error } = await supabase
          .from("position_hierarchy")
          .update({ hierarchy_level: pos.hierarchy_level })
          .eq("id", pos.id);

        if (error) {
          console.error("Error updating position:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      message: "직급 순서가 업데이트되었습니다.",
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/position-hierarchy:", error);
    return NextResponse.json(
      { error: "직급 순서 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 직급 삭제 (searchParams로 id 전달)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "삭제할 직급 id가 필요합니다." },
        { status: 400 }
      );
    }

    // 해당 직급을 사용하는 사용자가 있는지 확인
    const { data: usersWithPosition } = await supabase
      .from("position_hierarchy")
      .select("position_name")
      .eq("id", id)
      .single();

    if (usersWithPosition) {
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .eq("position", usersWithPosition.position_name)
        .limit(1);

      if (users && users.length > 0) {
        return NextResponse.json(
          { error: "해당 직급을 사용하는 사용자가 있어 삭제할 수 없습니다." },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase
      .from("position_hierarchy")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting position:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: "직급이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/position-hierarchy:", error);
    return NextResponse.json(
      { error: "직급 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
