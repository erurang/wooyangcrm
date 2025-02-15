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

    // 📌 신규 상담 데이터 가져오기
    const { data: newConsultations, error: newConsultationsError } =
      await supabase
        .from("consultations")
        .select("id, company_id")
        .eq("user_id", userId)
        .gte("created_at", startOfMonth.toISOString());

    if (newConsultationsError) {
      throw new Error(
        `Error fetching new consultations: ${newConsultationsError.message}`
      );
    }

    return NextResponse.json({
      newConsultations,
    });
  } catch (error) {
    console.error("Error fetching new consultations:", error);
    return NextResponse.json(
      { error: "Failed to fetch new consultations" },
      { status: 500 }
    );
  }
}
