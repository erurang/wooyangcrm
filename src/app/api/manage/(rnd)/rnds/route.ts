import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import type { RndProjectStatus, RndProjectType } from "@/types/rnd";

/**
 * GET /api/manage/rnds
 * R&D 과제 목록 조회 (페이지네이션, 필터링)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const name = searchParams.get("name") || "";
  const status = searchParams.get("status") as RndProjectStatus | null;
  const projectType = searchParams.get("project_type") as RndProjectType | null;
  const orgId = searchParams.get("org_id");
  const type = searchParams.get("type") || "rnd"; // rnd, brnd, develop

  try {
    let query = supabase
      .from("rnds")
      .select(
        `
        *,
        rnd_orgs(id, name, org_type, ministry)
      `,
        { count: "exact" }
      )
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false });

    // 과제 유형 필터 (레거시 호환)
    if (type) {
      query = query.eq("type", type);
    }

    // 검색어
    if (name) {
      query = query.or(`name.ilike.%${name}%,project_number.ilike.%${name}%,program_name.ilike.%${name}%`);
    }

    // 상태 필터
    if (status) {
      query = query.eq("status", status);
    }

    // 과제유형 필터
    if (projectType) {
      query = query.eq("project_type", projectType);
    }

    // 지원기관 필터
    if (orgId) {
      query = query.eq("org_id", orgId);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error("Error fetching rnds list:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      total: count || 0,
      page,
      pageSize: limit,
    });
  } catch (error) {
    console.error("Error fetching rnds list:", error);
    return NextResponse.json(
      { error: "Failed to fetch rnds list" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/manage/rnds
 * R&D 과제 추가
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      project_number,
      project_type,
      status = "planning",
      program_name,
      announcement_number,
      start_date,
      end_date,
      contract_date,
      gov_contribution,
      pri_contribution,
      in_kind_contribution,
      total_cost,
      support_org, // 레거시: 지원기관 이름
      org_id,      // 신규: 지원기관 ID
      lead_org_name,
      participating_orgs,
      principal_investigator_id,
      keywords,
      annual_plans,
      notes,
      type = "rnd",
    } = body;

    // org_id가 없으면 support_org 이름으로 찾기 (레거시 호환)
    let finalOrgId = org_id;
    if (!finalOrgId && support_org) {
      const { data: org, error: orgError } = await supabase
        .from("rnd_orgs")
        .select("id")
        .eq("name", support_org)
        .single();

      if (orgError || !org) {
        throw new Error(`지원기관(${support_org})을 찾을 수 없습니다.`);
      }
      finalOrgId = org.id;
    }

    const insertData: Record<string, unknown> = {
      name,
      type,
      start_date,
      end_date,
      gov_contribution,
      pri_contribution,
      total_cost,
      notes,
    };

    // 확장 필드 추가
    if (project_number) insertData.project_number = project_number;
    if (project_type) insertData.project_type = project_type;
    if (status) insertData.status = status;
    if (program_name) insertData.program_name = program_name;
    if (announcement_number) insertData.announcement_number = announcement_number;
    if (contract_date) insertData.contract_date = contract_date;
    if (in_kind_contribution) insertData.in_kind_contribution = in_kind_contribution;
    if (finalOrgId) insertData.org_id = finalOrgId;
    if (lead_org_name) insertData.lead_org_name = lead_org_name;
    if (participating_orgs) insertData.participating_orgs = participating_orgs;
    if (principal_investigator_id) insertData.principal_investigator_id = principal_investigator_id;
    if (keywords) insertData.keywords = keywords;
    if (annual_plans) insertData.annual_plans = annual_plans;

    const { data: rnds, error: rndsError } = await supabase
      .from("rnds")
      .insert([insertData])
      .select(`
        *,
        rnd_orgs(id, name)
      `)
      .single();

    if (rndsError || !rnds) {
      throw new Error(rndsError?.message || "R&D 과제 추가 실패");
    }

    return NextResponse.json({ data: rnds }, { status: 201 });
  } catch (error) {
    console.error("Error adding rnds:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to add R&D" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/manage/rnds
 * R&D 과제 수정
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      project_number,
      project_type,
      status,
      program_name,
      announcement_number,
      start_date,
      end_date,
      contract_date,
      gov_contribution,
      pri_contribution,
      in_kind_contribution,
      total_cost,
      support_org,
      org_id,
      lead_org_name,
      participating_orgs,
      principal_investigator_id,
      keywords,
      annual_plans,
      notes,
      type,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "과제 ID가 없습니다." }, { status: 400 });
    }

    // org_id 처리 (레거시 호환)
    let finalOrgId = org_id;
    if (!finalOrgId && support_org) {
      const { data: org, error: orgError } = await supabase
        .from("rnd_orgs")
        .select("id")
        .eq("name", support_org)
        .single();

      if (orgError || !org) {
        throw new Error(`지원기관(${support_org})을 찾을 수 없습니다.`);
      }
      finalOrgId = org.id;
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // 기본 필드
    if (name !== undefined) updateData.name = name;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (gov_contribution !== undefined) updateData.gov_contribution = gov_contribution;
    if (pri_contribution !== undefined) updateData.pri_contribution = pri_contribution;
    if (total_cost !== undefined) updateData.total_cost = total_cost;
    if (notes !== undefined) updateData.notes = notes;
    if (type !== undefined) updateData.type = type;
    if (finalOrgId) updateData.org_id = finalOrgId;

    // 확장 필드
    if (project_number !== undefined) updateData.project_number = project_number;
    if (project_type !== undefined) updateData.project_type = project_type;
    if (status !== undefined) updateData.status = status;
    if (program_name !== undefined) updateData.program_name = program_name;
    if (announcement_number !== undefined) updateData.announcement_number = announcement_number;
    if (contract_date !== undefined) updateData.contract_date = contract_date;
    if (in_kind_contribution !== undefined) updateData.in_kind_contribution = in_kind_contribution;
    if (lead_org_name !== undefined) updateData.lead_org_name = lead_org_name;
    if (participating_orgs !== undefined) updateData.participating_orgs = participating_orgs;
    if (principal_investigator_id !== undefined) updateData.principal_investigator_id = principal_investigator_id;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (annual_plans !== undefined) updateData.annual_plans = annual_plans;

    const { data: updateRnDs, error: rndsError } = await supabase
      .from("rnds")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        rnd_orgs(id, name)
      `)
      .single();

    if (rndsError) throw rndsError;

    return NextResponse.json({ data: updateRnDs });
  } catch (error) {
    console.error("Error updating rnds:", error);
    return NextResponse.json(
      { error: (error as Error).message || "과제 수정 실패" },
      { status: 500 }
    );
  }
}
