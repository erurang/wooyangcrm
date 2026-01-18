import { updateSession } from "@/utils/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// API 로깅 함수 (비동기 처리)
async function logApiRequest(
  request: NextRequest,
  response: NextResponse,
  startTime: number,
  userId?: string
) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // 로깅에서는 쿠키 설정 불필요
          },
        },
      }
    );

    const endpoint = new URL(request.url).pathname;
    const method = request.method;
    const responseTimeMs = Date.now() - startTime;
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0].trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await supabase.from("api_logs").insert({
      user_id: userId || null,
      endpoint,
      method,
      status_code: response.status,
      response_time_ms: responseTimeMs,
      ip_address: ipAddress,
      user_agent: userAgent,
      response_summary: response.status >= 400 ? `Error: ${response.status}` : "Success",
    });
  } catch (error) {
    // 로깅 실패는 무시 (메인 기능에 영향 없도록)
    console.error("API logging failed:", error);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API 요청인 경우 로깅 처리
  if (pathname.startsWith("/api/")) {
    // 내부 로깅 API나 특정 경로는 제외 (무한 루프 방지)
    const excludedPaths = ["/api/internal/", "/api/admin/logs/"];
    const shouldSkipLogging = excludedPaths.some(path => pathname.startsWith(path));

    if (!shouldSkipLogging) {
      const startTime = Date.now();

      // 요청 처리
      const response = NextResponse.next();

      // 사용자 ID 추출 시도 (쿼리 파라미터 또는 헤더에서)
      const url = new URL(request.url);
      const userId = url.searchParams.get("userId") || request.headers.get("x-user-id") || undefined;

      // 비동기로 로깅 (응답 지연 없이)
      // Edge Runtime에서는 waitUntil이 지원되지 않을 수 있으므로 fire-and-forget 방식 사용
      logApiRequest(request, response, startTime, userId);

      return response;
    }

    return NextResponse.next();
  }

  // 일반 페이지 요청은 세션 업데이트 처리
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/login",
    "/api/:path*", // API 경로 추가
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { jwtVerify } from "jose";

// const SECRET_KEY = new TextEncoder().encode(
//   process.env.JWT_SECRET || "default_key"
// );

// export async function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;
//   const tokenCookie = req.cookies.get("auth-token")?.value;

//   // 1) /login 페이지 접근 시, 이미 토큰이 유효하면 메인(/)으로 리다이렉트
//   if (pathname === "/login") {
//     if (tokenCookie) {
//       try {
//         // 토큰 검증
//         const { payload } = await jwtVerify(tokenCookie, SECRET_KEY);
//         console.log("이미 로그인됨, payload:", payload);
//         // 토큰 유효 => 메인으로 이동
//         return NextResponse.redirect(new URL("/", req.url));
//       } catch (err) {
//         // 토큰이 있긴 하지만 유효하지 않으면 => 로그인 페이지 접속 허용
//         return NextResponse.next();
//       }
//     }
//     // 토큰이 아예 없으면 그냥 로그인 페이지 접속 허용
//     return NextResponse.next();
//   }

//   // 2) /login 이 아닌 다른 경로 (로그인 필요한 페이지들)
//   //    토큰이 없으면 => /login으로 이동
//   if (!tokenCookie) {
//     console.log("토큰 없음: 로그인 페이지로 리다이렉트");
//     const loginUrl = new URL("/login", req.url);
//     loginUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
//     return NextResponse.redirect(loginUrl);
//   }

//   // 토큰 검증
//   try {
//     const { payload } = await jwtVerify(tokenCookie, SECRET_KEY);
//     console.log("JWT 검증 성공:", payload);

//     // 관리자 페이지 접근 제한
//     if (pathname.startsWith("/admin") && payload.role !== "admin") {
//       console.log("권한 없음: 관리자만 접근 가능");
//       return NextResponse.redirect("/403");
//     }

//     return NextResponse.next();
//   } catch (err: any) {
//     console.error("JWT 검증 실패:", err.message);
//     const loginUrl = new URL("/login", req.url);
//     loginUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
//     return NextResponse.redirect(loginUrl);
//   }
// }

// export const config = {
//   matcher: [
//     // /login 페이지 + 기타 보호된 페이지
//     "/login",
//     "/((?!_next/static|_next/image|favicon.ico|api).*)",
//   ],
// };
