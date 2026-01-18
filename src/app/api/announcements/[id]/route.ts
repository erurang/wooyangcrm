import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 특정 공지사항 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({ announcement: data });
  } catch (error) {
    console.error("공지사항 조회 오류:", error);
    return NextResponse.json(
      { error: "공지사항 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PUT: 공지사항 수정 (관리자용)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, priority, is_active, is_pinned, start_date, end_date } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (priority !== undefined) updateData.priority = priority;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;

    const { data, error } = await supabase
      .from("announcements")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "공지사항이 수정되었습니다", announcement: data });
  } catch (error) {
    console.error("공지사항 수정 오류:", error);
    return NextResponse.json(
      { error: "공지사항 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 공지사항 삭제 (관리자용)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ message: "공지사항이 삭제되었습니다" });
  } catch (error) {
    console.error("공지사항 삭제 오류:", error);
    return NextResponse.json(
      { error: "공지사항 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH: 공지사항 읽음 처리
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id가 필요합니다" },
        { status: 400 }
      );
    }

    // 이미 읽음 처리가 되어있는지 확인
    const { data: existing } = await supabase
      .from("announcement_reads")
      .select("id")
      .eq("announcement_id", id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: "이미 읽음 처리되었습니다" });
    }

    // 읽음 처리
    const { error } = await supabase
      .from("announcement_reads")
      .insert([
        {
          announcement_id: id,
          user_id: user_id,
        },
      ]);

    if (error) throw error;

    return NextResponse.json({ message: "공지사항을 읽음 처리했습니다" });
  } catch (error) {
    console.error("공지사항 읽음 처리 오류:", error);
    return NextResponse.json(
      { error: "공지사항 읽음 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
