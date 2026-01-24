import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/manage/rnds/[id]/researchers
 * 과제별 참여연구원 목록 조회
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("rnd_researchers")
      .select(`
        *,
        user:users(id, name, position, team:teams(name))
      `)
      .eq("rnd_id", id)
      .order("role", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching researchers:", error);
    return NextResponse.json(
      { error: "참여연구원 조회 실패" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manage/rnds/[id]/researchers
 * 참여연구원 추가
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      user_id,
      name,
      role,
      affiliation,
      position,
      specialty,
      participation_rate,
      personnel_cost,
      start_date,
      end_date,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "연구원 이름은 필수입니다." },
        { status: 400 }
      );
    }

    const insertData: Record<string, unknown> = {
      rnd_id: id,
      name,
      is_active: true,
    };

    if (user_id) insertData.user_id = user_id;
    if (role) insertData.role = role;
    if (affiliation) insertData.affiliation = affiliation;
    if (position) insertData.position = position;
    if (specialty) insertData.specialty = specialty;
    if (participation_rate !== undefined) insertData.participation_rate = participation_rate;
    if (personnel_cost !== undefined) insertData.personnel_cost = personnel_cost;
    if (start_date) insertData.start_date = start_date;
    if (end_date) insertData.end_date = end_date;
    if (notes) insertData.notes = notes;

    const { data, error } = await supabase
      .from("rnd_researchers")
      .insert([insertData])
      .select(`
        *,
        user:users(id, name, position)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error adding researcher:", error);
    return NextResponse.json(
      { error: "참여연구원 추가 실패" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/manage/rnds/[id]/researchers
 * 참여연구원 수정
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await params;
    const body = await req.json();
    const { researcher_id, ...updateFields } = body;

    if (!researcher_id) {
      return NextResponse.json(
        { error: "연구원 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const allowedFields = [
      "user_id", "name", "role", "affiliation", "position", "specialty",
      "participation_rate", "personnel_cost", "start_date", "end_date",
      "is_active", "notes",
    ];

    allowedFields.forEach((field) => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    const { data, error } = await supabase
      .from("rnd_researchers")
      .update(updateData)
      .eq("id", researcher_id)
      .select(`
        *,
        user:users(id, name, position)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error updating researcher:", error);
    return NextResponse.json(
      { error: "참여연구원 수정 실패" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/manage/rnds/[id]/researchers
 * 참여연구원 삭제 (또는 비활성화)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await params;
    const { searchParams } = req.nextUrl;
    const researcherId = searchParams.get("researcher_id");
    const hardDelete = searchParams.get("hard") === "true";

    if (!researcherId) {
      return NextResponse.json(
        { error: "연구원 ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (hardDelete) {
      // 완전 삭제
      const { error } = await supabase
        .from("rnd_researchers")
        .delete()
        .eq("id", researcherId);

      if (error) throw error;

      return NextResponse.json({ message: "참여연구원이 삭제되었습니다." });
    } else {
      // 비활성화
      const { error } = await supabase
        .from("rnd_researchers")
        .update({
          is_active: false,
          end_date: new Date().toISOString().split("T")[0],
          updated_at: new Date().toISOString(),
        })
        .eq("id", researcherId);

      if (error) throw error;

      return NextResponse.json({ message: "참여연구원이 비활성화되었습니다." });
    }
  } catch (error) {
    console.error("Error deleting researcher:", error);
    return NextResponse.json(
      { error: "참여연구원 삭제 실패" },
      { status: 500 }
    );
  }
}
