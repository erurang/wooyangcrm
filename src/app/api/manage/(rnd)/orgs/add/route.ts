import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const { name, email, fax, address, phone } = body;

    // 먼저 rnd_orgs에서 support_org의 id를 찾습니다.
    const { data: orgs, error: orgError } = await supabase
      .from("rnd_orgs")
      .insert([{ name, email, fax, address, phone }])
      .select()
      .single();

    if (orgError || !orgs) {
      throw new Error("org 추가 실패");
    }

    return NextResponse.json({ orgs });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to add org" },
      { status: 500 }
    );
  }
}
