import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/manage/brnds
 * 브랜드 R&D 사업 목록 조회 (페이지네이션)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const name = searchParams.get("name") || "";

  try {
    let query = supabase
      .from("rnds")
      .select("*, rnd_orgs(name)", { count: "exact" })
      .eq("type", "brnd")
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false });

    if (name) query = query.ilike("name", `%${name}%`);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      total: count || 0,
    });
  } catch (error) {
    console.error("Error fetching brnds list:", error);
    return NextResponse.json(
      { error: "Failed to fetch brnds list" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manage/brnds
 * 브랜드 R&D 사업 추가
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      start_date,
      end_date,
      gov_contribution,
      pri_contribution,
      total_cost,
      support_org,
    } = body;

    // rnd_orgs에서 support_org의 id를 찾습니다.
    const { data: org, error: orgError } = await supabase
      .from("rnd_orgs")
      .select("id")
      .eq("name", support_org)
      .single();

    if (orgError || !org) {
      throw new Error(`지원기관(${support_org})을 찾을 수 없습니다.`);
    }

    const { data: rnds, error: rndsError } = await supabase
      .from("rnds")
      .insert([
        {
          name,
          start_date,
          end_date,
          gov_contribution,
          pri_contribution,
          total_cost,
          type: "brnd",
          org_id: org.id,
        },
      ])
      .select()
      .single();

    if (rndsError || !rnds) {
      throw new Error("bRnds 추가 실패");
    }

    return NextResponse.json({ company: { ...rnds } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add bRnds" }, { status: 500 });
  }
}

/**
 * PUT /api/manage/brnds
 * 브랜드 R&D 사업 수정
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      start_date,
      end_date,
      gov_contribution,
      pri_contribution,
      total_cost,
      support_org,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "bRnDs ID가 없습니다." }, { status: 400 });
    }

    const { data: org, error: orgError } = await supabase
      .from("rnd_orgs")
      .select("id")
      .eq("name", support_org)
      .single();

    if (orgError || !org) {
      throw new Error(`지원기관(${support_org})을 찾을 수 없습니다.`);
    }

    const { data: updateRnDs, error: rndsError } = await supabase
      .from("rnds")
      .update({
        name,
        start_date,
        end_date,
        gov_contribution,
        pri_contribution,
        total_cost,
        type: "brnd",
        org_id: org.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (rndsError) throw rndsError;

    return NextResponse.json({
      company: { ...updateRnDs },
    });
  } catch (error) {
    console.error("Error updating brnds:", error);
    return NextResponse.json({ error: "brnds 수정 실패" }, { status: 500 });
  }
}
