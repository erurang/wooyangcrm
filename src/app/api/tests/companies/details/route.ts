import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (!companyId)
    return NextResponse.json(
      { error: "Company ID is required" },
      { status: 400 }
    );

  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
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
