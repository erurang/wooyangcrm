import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "userId가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // ✅ 유저 정보 조회
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, position, email, level")
      .eq("id", id)
      .single();

    if (error || !user) {
      throw new Error("유저 정보를 찾을 수 없습니다.");
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("유저 상세 정보 가져오기 실패:", error);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
