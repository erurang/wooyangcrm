import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 활성화된 공지사항 목록 조회 (또는 전체 - 관리자용)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const activeOnly = searchParams.get("activeOnly") === "true";

    let query = supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (activeOnly) {
      const now = new Date().toISOString();
      query = query
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`);
    }

    const { data: announcements, error } = await query;

    if (error) throw error;

    // 사용자 읽음 여부 확인
    if (userId && announcements) {
      const { data: readRecords } = await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("user_id", userId);

      const readIds = new Set(readRecords?.map((r) => r.announcement_id) || []);

      const announcementsWithReadStatus = announcements.map((a) => ({
        ...a,
        is_read: readIds.has(a.id),
      }));

      return NextResponse.json({ announcements: announcementsWithReadStatus });
    }

    return NextResponse.json({ announcements: announcements || [] });
  } catch (error) {
    console.error("공지사항 조회 오류:", error);
    return NextResponse.json(
      { error: "공지사항 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST: 새 공지사항 생성 (관리자용)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, priority, is_active, start_date, end_date, created_by } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "제목과 내용은 필수입니다" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("announcements")
      .insert([
        {
          title,
          content,
          priority: priority || "normal",
          is_active: is_active ?? true,
          start_date: start_date || null,
          end_date: end_date || null,
          created_by: created_by || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "공지사항이 생성되었습니다", announcement: data });
  } catch (error) {
    console.error("공지사항 생성 오류:", error);
    return NextResponse.json(
      { error: "공지사항 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
