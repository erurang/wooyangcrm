// /api/users - 직원 목록 가져오기

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// 직원 정보 가져오기
export async function GET() {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, position, level, works_email")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || [], { status: 200 });
}
