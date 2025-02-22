import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "default-secret-key";
const EXPIRATION_TIME = 60 * 60; // 1시간

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.json({ error: "토큰이 없습니다." }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, SECRET_KEY);
    const now = Math.floor(Date.now() / 1000);

    // ✅ 토큰 만료까지 5분 이하라면 새 토큰 발급
    if (decoded.exp - now < 300) {
      const newExp = now + EXPIRATION_TIME;
      const newToken = jwt.sign({ userId: decoded.userId }, SECRET_KEY, {
        expiresIn: "1h",
      });

      const res = NextResponse.json({ exp: newExp });
      res.cookies.set("auth-token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });

      return res;
    }

    return NextResponse.json({ exp: decoded.exp });
  } catch (error) {
    return NextResponse.json(
      { error: "유효하지 않은 토큰입니다." },
      { status: 401 }
    );
  }
}
