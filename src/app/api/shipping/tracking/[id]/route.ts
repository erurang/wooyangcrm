import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * 배송 추적 수정
 * PATCH /api/shipping/tracking/[id]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { data, error } = await supabase
      .from("shipping_tracking")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating shipping tracking:", error);
      return NextResponse.json(
        { error: "배송 추적 수정 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, tracking: data });
  } catch (error) {
    console.error("Error in PATCH /api/shipping/tracking/[id]:", error);
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 }
    );
  }
}

/**
 * 배송 추적 삭제
 * DELETE /api/shipping/tracking/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from("shipping_tracking")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting shipping tracking:", error);
      return NextResponse.json(
        { error: "배송 추적 삭제 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/shipping/tracking/[id]:", error);
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 }
    );
  }
}
