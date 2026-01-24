import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createSupabaseServer } from "@/utils/supabase/server";
import { startUserSession, logUserActivity } from "@/lib/apiLogger";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!userError && user) {
        const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";

        // ✅ 로그인 기록을 Supabase에 저장
        await supabase
          .from("login_logs")
          .insert([
            {
              email: user.email,
              login_time: new Date().toISOString(),
              ip_address: ipAddress,
              user_agent: userAgent,
            },
          ])
          .eq("email", user.email);

        // ✅ 사용자 세션 시작
        await startUserSession({
          userId: user.id,
          ipAddress,
          userAgent,
        });

        // ✅ 사용자 활동 로그 기록
        await logUserActivity({
          userId: user.id,
          action: "로그인",
          actionType: "auth",
          details: { email: user.email },
          ipAddress,
          userAgent,
        });
      }

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
