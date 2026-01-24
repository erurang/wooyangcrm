import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/manage/rnds/[id]/reports
 * 과제별 보고서 목록 조회
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;
    const reportType = searchParams.get("report_type");
    const year = searchParams.get("year");
    const status = searchParams.get("status");

    let query = supabase
      .from("rnd_reports")
      .select(`
        *,
        submitter:users!rnd_reports_submitted_by_fkey(id, name)
      `)
      .eq("rnd_id", id)
      .order("due_date", { ascending: false });

    if (reportType) {
      query = query.eq("report_type", reportType);
    }
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
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "보고서 조회 실패" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manage/rnds/[id]/reports
 * 보고서 추가
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      report_type,
      title,
      year,
      due_date,
      submitted_date,
      file_url,
      submitted_by,
      notes,
    } = body;

    if (!report_type || !title) {
      return NextResponse.json(
        { error: "보고서 유형과 제목은 필수입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("rnd_reports")
      .insert([
        {
          rnd_id: id,
          report_type,
          title,
          year,
          due_date,
          submitted_date,
          file_url,
          submitted_by,
          notes,
          status: submitted_date ? "submitted" : "draft",
        },
      ])
      .select(`
        *,
        submitter:users!rnd_reports_submitted_by_fkey(id, name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("Error adding report:", error);
    return NextResponse.json(
      { error: "보고서 추가 실패" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/manage/rnds/[id]/reports
 * 보고서 수정
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await params;
    const body = await req.json();
    const { report_id, ...updateFields } = body;

    if (!report_id) {
      return NextResponse.json(
        { error: "보고서 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const allowedFields = [
      "report_type", "title", "year", "due_date", "submitted_date",
      "status", "file_url", "submitted_by", "notes",
    ];

    allowedFields.forEach((field) => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    const { data, error } = await supabase
      .from("rnd_reports")
      .update(updateData)
      .eq("id", report_id)
      .select(`
        *,
        submitter:users!rnd_reports_submitted_by_fkey(id, name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "보고서 수정 실패" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/manage/rnds/[id]/reports
 * 보고서 삭제
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await params;
    const { searchParams } = req.nextUrl;
    const reportId = searchParams.get("report_id");

    if (!reportId) {
      return NextResponse.json(
        { error: "보고서 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("rnd_reports")
      .delete()
      .eq("id", reportId);

    if (error) throw error;

    return NextResponse.json({ message: "보고서가 삭제되었습니다." });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "보고서 삭제 실패" },
      { status: 500 }
    );
  }
}
