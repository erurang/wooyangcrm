import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 활성화된 공지사항 목록 조회 (또는 전체 - 관리자용)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const activeOnly = searchParams.get("activeOnly") === "true";
    const search = searchParams.get("search");
    const authorId = searchParams.get("authorId");

    let query = supabase
      .from("announcements")
      .select("*")
      .order("is_pinned", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (activeOnly) {
      // 활성화된 공지사항만 필터링
      query = query.eq("is_active", true);
    }

    // 제목 검색
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // 작성자 필터
    if (authorId) {
      query = query.eq("created_by", authorId);
    }

    const { data: rawAnnouncements, error } = await query;

    if (error) throw error;

    // activeOnly일 때 날짜 필터링 (JavaScript에서 처리)
    let announcements = rawAnnouncements || [];
    if (activeOnly) {
      const now = new Date();
      announcements = announcements.filter((a: any) => {
        // start_date가 있으면 현재 시간 이전이어야 함
        if (a.start_date && new Date(a.start_date) > now) {
          return false;
        }
        // end_date가 있으면 현재 시간 이후여야 함
        if (a.end_date && new Date(a.end_date) < now) {
          return false;
        }
        return true;
      });
    }

    // 작성자 이름 조회
    const authorIds = [...new Set((announcements || []).map((a: any) => a.created_by).filter(Boolean))];
    let authorMap: Record<string, string> = {};

    if (authorIds.length > 0) {
      const { data: authors } = await supabase
        .from("users")
        .select("id, name")
        .in("id", authorIds);

      authorMap = (authors || []).reduce((acc: Record<string, string>, u: any) => {
        acc[u.id] = u.name;
        return acc;
      }, {});
    }

    // 작성자 이름 매핑
    const announcementsWithAuthor = (announcements || []).map((a: any) => ({
      ...a,
      author_name: a.created_by ? (authorMap[a.created_by] || "알 수 없음") : "알 수 없음",
    }));

    // 사용자 읽음 여부 확인
    if (userId && announcementsWithAuthor.length > 0) {
      const { data: readRecords } = await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("user_id", userId);

      const readIds = new Set(readRecords?.map((r) => r.announcement_id) || []);

      const announcementsWithReadStatus = announcementsWithAuthor.map((a: any) => ({
        ...a,
        is_read: readIds.has(a.id),
      }));

      return NextResponse.json({ announcements: announcementsWithReadStatus });
    }

    return NextResponse.json({ announcements: announcementsWithAuthor });
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
