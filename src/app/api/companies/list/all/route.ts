import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { data, error } = await supabase.from("companies").select("*");

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
