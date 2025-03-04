import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email"); // 유저 ID 가져오기

    if (!email) {
      return NextResponse.json(
        { error: "email ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("login_logs")
      .select("ip_address, login_time, user_agent")
      .eq("email", email)
      .limit(2)
      .order("login_time", { ascending: false });
    if (error) {
      throw new Error(`Error fetching favorites: ${error.message}`);
    }

    if (data.length === 1) return NextResponse.json(data[0]);
    else return NextResponse.json(data.reverse()[0]);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}
