import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PATCH(request: Request) {
  try {
    const { id, status, status_reason } = await request.json();

    if (!id || !status || !status_reason) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // status_reason 데이터 정제: amount 필드가 없거나 빈 문자열이면 0으로 설정
    const sanitizedStatusReason: any = {};
    
    for (const key in status_reason) {
      if (status_reason[key]) {
        sanitizedStatusReason[key] = {
          reason: status_reason[key].reason || "",
          amount: status_reason[key].amount !== undefined && status_reason[key].amount !== "" 
            ? status_reason[key].amount 
            : 0
        };
      }
    }

    const { error } = await supabase
      .from("documents")
      .update({ status, status_reason: sanitizedStatusReason }) // ✅ 정제된 데이터 저장
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
