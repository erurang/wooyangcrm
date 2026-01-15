import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rndsId = searchParams.get("rndsId");

  if (!rndsId)
    return NextResponse.json({ error: "rnds ID is required" }, { status: 400 });

  try {
    const { data, error } = await supabase
      .from("rnds")
      .select("*, rnd_orgs(id,name)")
      .eq("id", rndsId)
      .single();

    if (error) throw error;

    return NextResponse.json({ ...data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch company details" },
      { status: 500 }
    );
  }
}
