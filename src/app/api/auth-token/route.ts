import { createSupabaseServer } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();

  // ✅ Supabase Auth 서버에서 인증된 사용자 정보 가져오기
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return NextResponse.json(
      { error: "인증되지 않은 사용자입니다." },
      { status: 401 }
    );
  }

  // ✅ Supabase 쿠키에서 세션 가져오기 (토큰 만료시간 포함)
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError || !sessionData?.session) {
    return NextResponse.json({ error: "세션이 없습니다." }, { status: 401 });
  }

  return NextResponse.json({
    provider_token: sessionData.session.provider_token, // ✅ 카카오 API에서 사용할 수 있는 OAuth 토큰
    access_token: sessionData.session.access_token, // 토큰
    expires_at: sessionData.session.expires_at, // 만료시간 (UNIX 타임스탬프)
    user: {
      id: userData.user.id,
      email: userData.user.email,
      name: userData.user.user_metadata.full_name,
      avatar: userData.user.user_metadata.avatar_url,
      last_sign_in_at: userData.user.last_sign_in_at,
    },
  });
}
