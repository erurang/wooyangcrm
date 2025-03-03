import { createSupabaseServer } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();

  // ✅ Supabase 세션 삭제
  await supabase.auth.signOut();

  // ✅ 로그아웃 후 메인 페이지로 이동
  return NextResponse.redirect(new URL("/", req.url));
}
