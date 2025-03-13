import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  const page = searchParams.get("page");
  const search = searchParams.get("search") || ""; // 🔹 검색어 추가

  if (!companyId || !page) {
    return NextResponse.json(
      { message: "Missing required parameters: companyId or page" },
      { status: 400 }
    );
  }

  const consultationsPerPage = 4;
  const pageNumber = parseInt(page, 10);

  const from = (pageNumber - 1) * consultationsPerPage;
  const to = pageNumber * consultationsPerPage - 1;

  try {
    let query = supabase
      .from("consultations")
      .select(
        "id, date, content, follow_up_date, user_id, documents(type), created_at",
        { count: "exact" }
      )
      .eq("company_id", companyId)
      .range(from, to)
      .order("created_at", { ascending: false });

    // 🔹 검색어가 있는 경우, content에서 검색
    if (search) {
      query = query.ilike("content", `%${search}%`); // 🔍 부분 일치 검색 (대소문자 구분 X)
    }

    const { data, error, count } = await query;

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
