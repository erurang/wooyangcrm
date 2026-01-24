import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/manage/rnds/[id]/milestones
 * 과제별 마일스톤 목록 조회
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;
    const year = searchParams.get("year");
    const status = searchParams.get("status");

    let query = supabase
      .from("rnd_milestones")
      .select("*")
      .eq("rnd_id", id)
      .order("sort_order", { ascending: true })
      .order("target_date", { ascending: true });

    if (year) {
      query = query.eq("year", parseInt(year));
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json(
      { error: "마일스톤 조회 실패" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manage/rnds/[id]/milestones
 * 마일스톤 추가
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      title,
      description,
      year,
      target_date,
      responsible_person,
      deliverables,
      notes,
      sort_order,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "마일스톤 제목은 필수입니다." },
        { status: 400 }
      );
    }

    // sort_order가 없으면 마지막 순서로 설정
    let finalSortOrder = sort_order;
    if (finalSortOrder === undefined) {
      const { data: lastMilestone } = await supabase
        .from("rnd_milestones")
        .select("sort_order")
        .eq("rnd_id", id)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();

      finalSortOrder = (lastMilestone?.sort_order || 0) + 1;
    }

    const { data, error } = await supabase
      .from("rnd_milestones")
      .insert([
        {
          rnd_id: id,
          title,
          description,
          year,
          target_date,
          responsible_person,
          deliverables,
          notes,
          sort_order: finalSortOrder,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error adding milestone:", error);
    return NextResponse.json(
      { error: "마일스톤 추가 실패" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/manage/rnds/[id]/milestones
 * 마일스톤 수정
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await params;
    const body = await req.json();
    const { milestone_id, ...updateFields } = body;

    if (!milestone_id) {
      return NextResponse.json(
        { error: "마일스톤 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const allowedFields = [
      "title", "description", "year", "target_date", "completed_date",
      "status", "responsible_person", "deliverables", "notes", "sort_order",
    ];

    allowedFields.forEach((field) => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    const { data, error } = await supabase
      .from("rnd_milestones")
      .update(updateData)
      .eq("id", milestone_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json(
      { error: "마일스톤 수정 실패" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/manage/rnds/[id]/milestones
 * 마일스톤 삭제
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await params;
    const { searchParams } = req.nextUrl;
    const milestoneId = searchParams.get("milestone_id");

    if (!milestoneId) {
      return NextResponse.json(
        { error: "마일스톤 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("rnd_milestones")
      .delete()
      .eq("id", milestoneId);

    if (error) throw error;

    return NextResponse.json({ message: "마일스톤이 삭제되었습니다." });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json(
      { error: "마일스톤 삭제 실패" },
      { status: 500 }
    );
  }
}
