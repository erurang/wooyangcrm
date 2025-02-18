import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "회사 ID가 없습니다." }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("companies")
      .select("name, phone, fax")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "회사 정보를 가져오는 데 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ company: data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
