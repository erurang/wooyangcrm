import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// ✅ GET - 특정 유저의 할 일 가져오기
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 200 });
}

// ✅ POST - 새 할 일 추가
export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("todos")
    .insert([{ user_id: userId, content: "", start_date: new Date() }])
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

// ✅ PUT - 할 일 내용 및 기한 수정 (자동 저장)
export async function PUT(req: NextRequest) {
  const { id, content, due_date } = await req.json();

  if (!id || content === undefined) {
    return NextResponse.json(
      { error: "id and content are required" },
      { status: 400 }
    );
  }

  // 업데이트할 필드 구성
  const updateData: { content: string; due_date?: string | null } = { content };
  if (due_date !== undefined) {
    updateData.due_date = due_date;
  }

  const { error } = await supabase
    .from("todos")
    .update(updateData)
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    { message: "Todo updated successfully" },
    { status: 200 }
  );
}

// ✅ PATCH - 체크박스 상태 변경
export async function PATCH(req: NextRequest) {
  const { id, is_completed } = await req.json();

  if (!id || is_completed === undefined) {
    return NextResponse.json(
      { error: "id and is_completed are required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("todos")
    .update({ is_completed })
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Todo status updated" }, { status: 200 });
}

// ✅ DELETE - 할 일 삭제
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase.from("todos").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    { message: "Todo deleted successfully" },
    { status: 200 }
  );
}
