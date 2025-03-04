import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createSupabaseServer } from "@/utils/supabase/server";

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
        // ✅ 로그인 기록을 Supabase에 저장
        await supabase
          .from("login_logs")
          .insert([
            {
              email: user.email,
              login_time: new Date().toISOString(),
              ip_address: request.headers.get("x-forwarded-for") || "unknown",
              user_agent: request.headers.get("user-agent"),
            },
          ])
          .eq("email", user.email);
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
