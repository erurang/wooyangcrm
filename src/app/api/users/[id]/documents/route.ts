import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!id || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  // ✅ Supabase RPC 호출
  const { data, error } = await supabase.rpc("get_consultations_by_user", {
    user_param: id,
    start_date: startDate,
    end_date: endDate,
  });

  if (error) {
    console.error("Error fetching user documents:", error);
    // 타임아웃 에러(57014)인 경우 빈 배열 반환 (대시보드 깨짐 방지)
    if (error.code === "57014") {
      return NextResponse.json([]);
    }
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? []);
}
