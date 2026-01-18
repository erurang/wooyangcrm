import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET - 사용자 메모 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("user_memos")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" - that's OK
      throw error;
    }

    return NextResponse.json({ memo: data?.content || "" });
  } catch (error) {
    console.error("Get memo error:", error);
    return NextResponse.json({ error: "Failed to fetch memo" }, { status: 500 });
  }
}

// POST - 메모 저장 (upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, content } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_memos")
      .upsert(
        {
          user_id: userId,
          content: content || "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save memo error:", error);
    return NextResponse.json({ error: "Failed to save memo" }, { status: 500 });
  }
}
