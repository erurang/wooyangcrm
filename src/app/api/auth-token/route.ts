import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "default-secret-key";

export async function GET(req: NextRequest) {
  const token = req.headers
    .get("cookie")
    ?.split("; ")
    .find((row) => row.startsWith("auth-token="))
    ?.split("=")[1];

  if (!token) {
    return NextResponse.json({ error: "토큰이 없습니다." }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as any;

    // ✅ 클라이언트의 IP 주소 가져오기
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "알 수 없음";

    return NextResponse.json({
      ...decoded,
      clientIp, // ✅ 추가된 IP 정보
    });
  } catch (error) {
    return NextResponse.json(
      { error: "유효하지 않은 토큰입니다." },
      { status: 401 }
    );
  }
}
