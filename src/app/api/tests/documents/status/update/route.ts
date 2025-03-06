import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PATCH(request: Request) {
  try {
    const { id, status, status_reason } = await request.json();

    if (!id || !status || !status_reason) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { error } = await supabase
      .from("documents")
      .update({ status, status_reason }) // ✅ JSONB 필드로 저장
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json(
      { message: "Document status updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update document status", details: error },
      { status: 500 }
    );
  }
}
