import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const {
      name,
      start_date,
      end_date,
      gov_contribution,
      pri_contribution,
      total_cost,
      support_org, // 이 값은 name (문자열)
    } = body;

    // 먼저 rnd_orgs에서 support_org의 id를 찾습니다.
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
          type: "rnd",
          org_id: org.id, // ✅ org.id로 저장
        },
      ])
      .select()
      .single();

    if (rndsError || !rnds) {
      throw new Error("R&D 사업 추가 실패");
    }

    return NextResponse.json({ rnds });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to add R&D" },
      { status: 500 }
    );
  }
}
