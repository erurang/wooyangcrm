import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 입출고 내역 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("product_transactions")
      .select("*", { count: "exact" })
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      transactions: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("입출고 내역 조회 오류:", error);
    return NextResponse.json(
      { error: "입출고 내역 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
