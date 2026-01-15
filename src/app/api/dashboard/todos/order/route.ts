import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// PUT - 할 일 순서 업데이트
export async function PUT(req: NextRequest) {
  try {
    const { todos } = await req.json();

    if (!todos || !Array.isArray(todos)) {
      return NextResponse.json(
        { error: "todos array is required" },
        { status: 400 }
      );
    }

    // 각 todo의 sort_order 업데이트
    const updatePromises = todos.map(
      (todo: { id: string; sort_order: number }) =>
        supabase
          .from("todos")
          .update({ sort_order: todo.sort_order })
          .eq("id", todo.id)
    );

    const results = await Promise.all(updatePromises);

    // 에러 체크
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "일부 할일 순서 업데이트 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "순서가 업데이트되었습니다" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Todo order update error:", error);
    return NextResponse.json(
      { error: "순서 업데이트 중 오류 발생" },
      { status: 500 }
    );
  }
}
