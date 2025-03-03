import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { sendEmail } from "@/lib/sendEmail";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "default-secret-key";
const IP_CHANGE_THRESHOLD = 3; // ✅ 거리 차이 기준 (단위: km)

type RoleData = {
  roles: {
    role_name: string;
  };
};
export async function POST(req: NextRequest) {
  const { email, code } = await req.json();

  const forwarded = req.headers.get("x-forwarded-for");
  const currentIp = forwarded ? forwarded.split(",")[0].trim() : "알 수 없음";

  // 인증번호 검증
  const { data: verificationData, error: verificationError } = await supabase
    .from("verification_codes")
    .select("*")
    .eq("email", email)
    .eq("code", code)
    .maybeSingle(); // ✅ 조회 결과가 없으면 null 반환

  if (!verificationData) {
    console.log("veriyfy-code api error", verificationError);

    return NextResponse.json(
      { error: "잘못된 인증번호입니다." },
      { status: 400 }
    );
  }

  // 인증번호 만료 체크
  const now = new Date().toISOString();
  if (verificationData.expires_at < now) {
    return NextResponse.json(
      { error: "인증번호가 만료되었습니다." },
      { status: 400 }
    );
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, roles(id,role_name)")
    .eq("email", email)
    .maybeSingle(); // ✅ 데이터가 없으면 null 반환

  if (userError || !userData) {
    return NextResponse.json(
      { error: "사용자 역할을 가져올 수 없습니다." },
      { status: 500 }
    );
  }

  const roleName = (userData as any)?.roles?.role_name; // ✅ 역할이 없으면 기본값 설정

  if (userError || !userData) {
    return NextResponse.json(
      { error: "사용자 역할을 가져올 수 없습니다." },
      { status: 500 }
    );
  }

  // 로그인 기록 저장
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("remote-addr") ||
    "IP 주소를 확인할 수 없습니다.";

  await supabase.from("login_logs").insert({
    email,
    ip_address: ip,
    login_time: new Date().toISOString(),
  });

  // 관리자에게 이메일 발송
  const adminEmail = "info@iwooyang.com";
  // const emailSubject = `${email} / ${locationDetails}`;
  // <p><strong>위치:</strong> ${locationDetails}</p>
  // <p><strong>위도/경도:</strong> ${latitude || "N/A"}, ${
  // longitude || "N/A"
  const emailSubject = `${email}`;
  const emailContent = `
    <h2>로그인 알림</h2>
    <p><strong>로그인한 이메일:</strong> ${email}</p>
    <p><strong>로그인 IP:</strong> ${ip}</p>
  }</p>
    <p><strong>로그인 시간:</strong> ${new Date().toISOString()}</p>
  `;

  try {
    await sendEmail(adminEmail, emailSubject, emailContent);
    console.log("관리자에게 로그인 알림 이메일이 전송되었습니다.");
  } catch (err) {
    console.error("관리자 이메일 전송 오류:", err);
  }

  // JWT 토큰 생성 (role 포함)
  const token = jwt.sign({ email, role: roleName, ip: currentIp }, SECRET_KEY, {
    expiresIn: "12h",
  });

  // JWT를 HttpOnly 쿠키에 저장
  const response = NextResponse.json({ message: "로그인 성공!" });
  response.cookies.set("auth-token", token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 36000,
  });

  return response;
}
