import { createSupabaseServer } from "@/utils/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { endUserSession, logUserActivity, getIpFromRequest, getUserAgentFromRequest } from "@/lib/apiLogger";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();

  // 현재 사용자 정보 가져오기 (세션 종료 전에)
  const { data: { user } } = await supabase.auth.getUser();

  // ✅ 사용자 세션 종료 및 활동 로그 기록
  if (user) {
    const ipAddress = getIpFromRequest(req);
    const userAgent = getUserAgentFromRequest(req);

    await endUserSession(user.id);

    await logUserActivity({
      userId: user.id,
      action: "로그아웃",
      actionType: "auth",
      details: { email: user.email },
      ipAddress,
      userAgent,
    });
  }

  // ✅ Supabase 세션 삭제
  await supabase.auth.signOut();

  // ✅ 로그아웃 후 메인 페이지로 이동
  return NextResponse.redirect(new URL("/", req.url));
}
