import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // `documents` 테이블에서 기본 문서 조회 (분리된 컬럼 포함)
    const { data: documents, error } = await supabase
      .from("documents")
      .select(
        "id, type, status, created_at, content, company_id, document_number, notes, valid_until, delivery_date, total_amount, delivery_term, delivery_place"
      )
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (error) throw new Error(`Error fetching documents: ${error.message}`);

    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
