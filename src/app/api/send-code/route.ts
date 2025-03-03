import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  // const { email } = await req.json();

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const supabase = await createSupabaseServer();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: `${SITE_URL}/api/auth/callback`,
    },
  });

  // if (data.url) {
  //   redirect(data.url) // use the redirect API for your server framework
  // }

  // const { data, error } = await supabase.auth.signInWithOAuth({
  //   provider: "kakao",
  // });

  // console.log("data,error", data, error);

  // if (error) {
  //   return NextResponse.json(
  //     { error: "이메일 인증 요청 실패" },
  //     { status: 500 }
  //   );
  // }

  return NextResponse.json({ message: "인증번호가 전송되었습니다." });
}
