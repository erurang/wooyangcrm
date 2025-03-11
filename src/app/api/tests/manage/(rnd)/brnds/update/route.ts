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
    // return;

    const { data: updateRnDs, error: rndsError } = await supabase
      .from("bRnDs")
      .update({
        name,
        start_date,
        end_date,
        gov_contribution,
        pri_contribution,
        total_cost,
        support_org,
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
