import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  const page = searchParams.get("page");

  if (!companyId || !page) {
    return NextResponse.json(
      { message: "Missing required parameters: companyId or page" },
      { status: 400 }
    );
  }

  const consultationsPerPage = 5;
  const pageNumber = parseInt(page, 10);

  const from = (pageNumber - 1) * consultationsPerPage;
  const to = pageNumber * consultationsPerPage - 1;

  try {
    const { data, error, count } = await supabase
      .from("consultations")
      .select("id, date, content, follow_up_date, user_id, documents(type)", {
        count: "exact",
      })
      .eq("company_id", companyId)
      .range(from, to)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        consultations: data,
        totalPages: count ? Math.ceil(count / consultationsPerPage) : 1,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to fetch consultations",
        error: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}
