import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 운송업체 목록 조회
export async function GET() {
  try {
    const { data: carriers, error } = await supabase
      .from("shipping_carriers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[shipping-carriers] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ carriers: carriers || [] });
  } catch (error) {
    console.error("[shipping-carriers] Unexpected error:", error);
    return NextResponse.json(
      { error: "운송업체 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
