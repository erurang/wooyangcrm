import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .or("is_overseas.is.null,is_overseas.eq.false"); // 해외거래처 제외

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      companies: data,
    });
  } catch (error) {
    console.error("Error fetching companies list:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies list" },
      { status: 500 }
    );
  }
}
