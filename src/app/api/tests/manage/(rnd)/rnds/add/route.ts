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
      support_org,
    } = body;

    const { data: rnds, error: rndsError } = await supabase
      .from("RnDs")
      .insert([
        {
          name,
          start_date,
          end_date,
          gov_contribution,
          pri_contribution,
          total_cost,
          support_org,
        },
      ])
      .select()
      .single();

    if (rndsError || !rnds) {
      throw new Error("Rnds 추가 실패");
    }

    return NextResponse.json({
      company: { ...rnds },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add company" },
      { status: 500 }
    );
  }
}
