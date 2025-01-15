// /pages/api/users.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// 직원 정보 가져오기
export async function GET() {
  const { data, error } = await supabase.from("users").select("id, name"); // 직원 ID와 이름

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
