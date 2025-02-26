import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";
// import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  return await updateSession(req);
  // const supabase = createMiddlewareClient({ req, res });

  // ✅ 1️⃣ 쿠키 동기화 시도 (필수!)
  // const { data: userData, error: userError } = await supabase.auth.getUser();
  // console.log("🔄 Middleware User:", userData.user);

  // // ✅ 2️⃣ 세션 가져오기
  // const { data: sessionData, error: sessionError } =
  //   await supabase.auth.getSession();
  // console.log("🔍 Middleware Session:", sessionData.session);

  // ✅ 3️⃣ 세션이 없거나 만료되었으면 /login으로 리디렉트
  // if (!sessionData.session || sessionError) {
  //   console.log("🚫 세션 없음 또는 만료됨: 로그인 페이지로 이동");
  //   const loginUrl = new URL("/login", req.url);
  //   loginUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api).*)"], // 로그인 필요 없는 페이지 제외
};

// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { jwtVerify } from "jose";

// const SECRET_KEY = new TextEncoder().encode(
//   process.env.JWT_SECRET || "default_key"
// );

// export async function middleware(req: NextRequest) {
//   const tokenCookie = req.cookies.get("auth-token");

//   if (!tokenCookie) {
//     console.log("토큰 없음: 로그인 페이지로 리다이렉트");
//     const loginUrl = new URL("/login", req.url);
//     loginUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
//     return NextResponse.redirect(loginUrl);
//   }

//   const token = tokenCookie.value;

//   try {
//     // JWT 검증
//     const { payload } = await jwtVerify(token, SECRET_KEY);

//     console.log("JWT 검증 성공:", payload); // 디코딩된 payload 출력

//     // 관리자 페이지 접근 제한
//     if (req.nextUrl.pathname.startsWith("/admin") && payload.role !== "admin") {
//       console.log("권한 없음: 관리자만 접근 가능");
//       return NextResponse.redirect("/403"); // 권한 없음 페이지로 리다이렉트
//     }
//     const response = NextResponse.next();

//     return response;
//   } catch (err: any) {
//     console.error("JWT 검증 실패:", err.message);
//     const loginUrl = new URL("/login", req.url);
//     loginUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
//     return NextResponse.redirect(loginUrl); // JWT 검증 실패 시 로그인 페이지로 이동
//   }
// }

// export const config = {
//   matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api).*)"],
// };
