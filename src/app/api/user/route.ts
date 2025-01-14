import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "default-secret-key";

export async function GET(req: Request) {
  const token = req.headers
    .get("cookie")
    ?.split("; ")
    .find((row) => row.startsWith("auth-token="))
    ?.split("=")[1];

  if (!token) {
    return NextResponse.json({ error: "토큰이 없습니다." }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return NextResponse.json(decoded);
  } catch (error) {
    return NextResponse.json(
      { error: "유효하지 않은 토큰입니다." },
      { status: 401 }
    );
  }
}
