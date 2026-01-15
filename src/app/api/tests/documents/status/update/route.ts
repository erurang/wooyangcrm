import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function PATCH(request: Request) {
  try {
    const { id, status, status_reason } = await request.json();

    console.log("Received status_reason:", JSON.stringify(status_reason, null, 2));

    if (!id || !status || !status_reason) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // status_reason 데이터 정제: reason만 저장 (amount 필드 완전 제거)
    const sanitizedStatusReason: any = {};
    
    for (const key in status_reason) {
      if (status_reason[key]) {
        // reason 필드만 저장
        sanitizedStatusReason[key] = {
          reason: status_reason[key].reason || ""
        };
      }
    }

    console.log("Sanitized status_reason:", JSON.stringify(sanitizedStatusReason, null, 2));

    // 먼저 현재 문서 정보 조회
    const { data: currentDoc, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    console.log("Current document:", currentDoc);
    console.log("Fetch error:", fetchError);

    // 먼저 status만 업데이트 시도
    console.log("First, trying to update status only...");
    const { data: statusData, error: statusError } = await supabase
      .from("documents")
      .update({ status })
      .eq("id", id)
      .select();

    console.log("Status update result:", statusData);
    console.log("Status update error:", statusError);

    if (statusError) {
      console.log("Status update failed, error:", statusError);
      throw statusError;
    }

    // status 업데이트 성공하면 status_reason 업데이트
    console.log("Now updating status_reason...");
    const { data, error } = await supabase
      .from("documents")
      .update({ status_reason: sanitizedStatusReason })
      .eq("id", id)
      .select();

    console.log("Update result:", data);
    console.log("Update error:", error);

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
