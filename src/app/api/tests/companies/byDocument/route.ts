import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyIds = searchParams.get("companyIds");

    if (!companyIds) {
      return NextResponse.json(
        { error: "Company IDs are required" },
        { status: 400 }
      );
    }

    const companyIdArray = companyIds.split(",");

    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, created_at")
      .in("id", companyIdArray);

    if (companiesError) {
      throw new Error(`Error fetching companies: ${companiesError.message}`);
    }

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Error fetching companies by document:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies by document" },
      { status: 500 }
    );
  }
}
