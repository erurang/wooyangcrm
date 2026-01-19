import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// POST: 다운로드 기록 저장
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { file_id, file_type, file_name, user_id, related_id, post_id } = body;

    if (!file_id || !user_id) {
      return NextResponse.json(
        { error: "파일 ID와 사용자 ID가 필요합니다" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("file_downloads")
      .insert({
        file_id,
        file_type: file_type || "general",
        file_name: file_name || "",
        user_id,
        post_id: post_id || related_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("다운로드 기록 저장 실패:", error);
      return NextResponse.json(
        { error: "다운로드 기록 저장에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("다운로드 기록 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// GET: 다운로드 기록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("file_id");

    if (!fileId) {
      return NextResponse.json(
        { error: "파일 ID가 필요합니다" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("file_downloads")
      .select(`
        id,
        created_at,
        users:user_id (
          id,
          name,
          level
        )
      `)
      .eq("file_id", fileId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("다운로드 기록 조회 실패:", error);
      return NextResponse.json(
        { error: "다운로드 기록 조회에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ records: data || [] });
  } catch (error) {
    console.error("다운로드 기록 조회 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
