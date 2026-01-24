import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/manage/consultations
 * R&D 상담 목록 조회 (페이지네이션, 검색)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rndId = searchParams.get("rndId");
  const page = searchParams.get("page");
  const search = searchParams.get("search") || "";

  if (!rndId || !page) {
    return NextResponse.json(
      { message: "Missing required parameters: rndId or page" },
      { status: 400 }
    );
  }

  const consultationsPerPage = 4;
  const pageNumber = parseInt(page, 10);

  const from = (pageNumber - 1) * consultationsPerPage;
  const to = pageNumber * consultationsPerPage - 1;

  try {
    let query = supabase
      .from("rnds_consultations")
      .select("*", { count: "exact" })
      .eq("rnd_id", rndId)
      .range(from, to)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("content", `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      consultations: data,
      totalPages: count ? Math.ceil(count / consultationsPerPage) : 1,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch consultations",
        error: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manage/consultations
 * R&D 상담 추가
 */
export async function POST(request: NextRequest) {
  try {
    const {
      date,
      rnd_id,
      org_id,
      content,
      user_id,
      start_date,
      end_date,
      total_cost,
      gov_contribution,
      pri_contribution,
      participation,
    } = await request.json();

    if (!rnd_id || !org_id || !user_id || !participation) {
      return NextResponse.json(
        { error: "필수 값이 없습니다." },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase
      .from("rnds_consultations")
      .insert([
        {
          date,
          rnd_id,
          org_id,
          content,
          user_id,
          start_date,
          end_date,
          total_cost,
          gov_contribution,
          pri_contribution,
          participation,
        },
      ]);

    if (insertError) {
      throw new Error("상담 내역 추가 실패");
    }

    return NextResponse.json({ message: "상담 내역 추가 완료" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

/**
 * PATCH /api/manage/consultations
 * R&D 상담 수정
 */
export async function PATCH(request: NextRequest) {
  try {
    const {
      consultation_id,
      rnd_id,
      content,
      user_id,
      start_date,
      end_date,
      total_cost,
      gov_contribution,
      pri_contribution,
      participation,
    } = await request.json();

    if (!consultation_id || !rnd_id || !user_id || !participation) {
      return NextResponse.json(
        { error: "필수 값이 없습니다." },
        { status: 400 }
      );
    }

    const { error: consultationUpdateError } = await supabase
      .from("rnds_consultations")
      .update({
        content,
        user_id,
        start_date,
        end_date,
        total_cost,
        gov_contribution,
        pri_contribution,
        participation,
      })
      .eq("id", consultation_id);

    if (consultationUpdateError) {
      return NextResponse.json(
        { error: "상담 내역 수정 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "상담 내역 수정 완료" });
  } catch (error) {
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
