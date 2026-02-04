import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * LOT 트랜잭션 이력 조회
 * GET /api/inventory/lots/[id]/transactions
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const { data, error } = await supabase
      .from("lot_transactions")
      .select(
        `
        *,
        document:documents!lot_transactions_document_id_fkey (
          id, document_number, type
        ),
        creator:users!lot_transactions_created_by_fkey (
          id, name
        )
      `
      )
      .eq("lot_id", id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching lot transactions:", error);
      return NextResponse.json(
        { error: "트랜잭션 조회 실패", transactions: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({
      transactions: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/inventory/lots/[id]/transactions:", error);
    return NextResponse.json(
      { error: "서버 오류", transactions: [] },
      { status: 500 }
    );
  }
}
