import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 유저 통계 조회
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // 병렬로 카운트 조회
  const [postsResult, consultationsResult, documentsResult] = await Promise.all(
    [
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("deleted_at", null),
      supabase
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("deleted_at", null),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]
  );

  return NextResponse.json({
    postsCount: postsResult.count || 0,
    consultationsCount: consultationsResult.count || 0,
    documentsCount: documentsResult.count || 0,
  });
}
