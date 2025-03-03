import { updateSession } from "@/utils/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
export const config = {
  matcher: [
    "/login",
    "/((?!_next/static|_next/image|favicon.ico|api|images/).*)", // ✅ images 폴더 허용!
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
