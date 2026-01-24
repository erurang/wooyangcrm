import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/manage/rnds/[id]/outcomes
 * 과제별 성과물 목록 조회
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;
    const outcomeType = searchParams.get("type");

    let query = supabase
      .from("rnd_outcomes")
      .select("*")
      .eq("rnd_id", id)
      .order("created_at", { ascending: false });

    if (outcomeType) {
      query = query.eq("outcome_type", outcomeType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching outcomes:", error);
    return NextResponse.json(
      { error: "성과물 조회 실패" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manage/rnds/[id]/outcomes
 * 성과물 추가
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      outcome_type,
      title,
      description,
      // 특허
      application_number,
      registration_number,
      application_date,
      registration_date,
      // 논문
      journal_name,
      publish_date,
      authors,
      doi,
      impact_factor,
      // 기술이전
      transferee,
      transfer_amount,
      transfer_date,
      // 매출
      sales_amount,
      // 공통
      file_url,
      evidence_file_url,
      status = "planned",
      target_year,
      achievement_year,
      notes,
    } = body;

    if (!outcome_type || !title) {
      return NextResponse.json(
        { error: "성과유형과 제목은 필수입니다." },
        { status: 400 }
      );
    }

    const insertData: Record<string, unknown> = {
      rnd_id: id,
      outcome_type,
      title,
      description,
      status,
      notes,
    };

    // 선택적 필드
    if (application_number) insertData.application_number = application_number;
    if (registration_number) insertData.registration_number = registration_number;
    if (application_date) insertData.application_date = application_date;
    if (registration_date) insertData.registration_date = registration_date;
    if (journal_name) insertData.journal_name = journal_name;
    if (publish_date) insertData.publish_date = publish_date;
    if (authors) insertData.authors = authors;
    if (doi) insertData.doi = doi;
    if (impact_factor) insertData.impact_factor = impact_factor;
    if (transferee) insertData.transferee = transferee;
    if (transfer_amount) insertData.transfer_amount = transfer_amount;
    if (transfer_date) insertData.transfer_date = transfer_date;
    if (sales_amount) insertData.sales_amount = sales_amount;
    if (file_url) insertData.file_url = file_url;
    if (evidence_file_url) insertData.evidence_file_url = evidence_file_url;
    if (target_year) insertData.target_year = target_year;
    if (achievement_year) insertData.achievement_year = achievement_year;

    const { data, error } = await supabase
      .from("rnd_outcomes")
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error adding outcome:", error);
    return NextResponse.json(
      { error: "성과물 추가 실패" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/manage/rnds/[id]/outcomes
 * 성과물 수정
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await params; // rnd_id는 검증용으로만 사용
    const body = await req.json();
    const { outcome_id, ...updateFields } = body;

    if (!outcome_id) {
      return NextResponse.json(
        { error: "성과물 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // 허용된 필드만 업데이트
    const allowedFields = [
      "outcome_type", "title", "description", "status",
      "application_number", "registration_number", "application_date", "registration_date",
      "journal_name", "publish_date", "authors", "doi", "impact_factor",
      "transferee", "transfer_amount", "transfer_date", "sales_amount",
      "file_url", "evidence_file_url", "target_year", "achievement_year", "notes",
    ];

    allowedFields.forEach((field) => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    const { data, error } = await supabase
      .from("rnd_outcomes")
      .update(updateData)
      .eq("id", outcome_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error updating outcome:", error);
    return NextResponse.json(
      { error: "성과물 수정 실패" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/manage/rnds/[id]/outcomes
 * 성과물 삭제
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await params;
    const { searchParams } = req.nextUrl;
    const outcomeId = searchParams.get("outcome_id");

    if (!outcomeId) {
      return NextResponse.json(
        { error: "성과물 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("rnd_outcomes")
      .delete()
      .eq("id", outcomeId);

    if (error) throw error;

    return NextResponse.json({ message: "성과물이 삭제되었습니다." });
  } catch (error) {
    console.error("Error deleting outcome:", error);
    return NextResponse.json(
      { error: "성과물 삭제 실패" },
      { status: 500 }
    );
  }
}
