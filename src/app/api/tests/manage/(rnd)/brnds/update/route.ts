import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
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
      return NextResponse.json(
        { error: "bRnDs ID가 없습니다." },
        { status: 400 }
      );
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
        org_id: org.id, // ✅ org.id로 저장
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
