import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    let query = supabase
      .from("rnd_orgs")
      .select("*", { count: "exact" })
      .order("name", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching orgs list:", error);
    return NextResponse.json(
      { error: "Failed to fetch orgs list" },
      { status: 500 }
    );
  }
}
