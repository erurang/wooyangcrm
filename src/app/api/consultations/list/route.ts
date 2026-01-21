import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");
  let page = searchParams.get("page");
  const search = searchParams.get("search") || "";
  const highlightId = searchParams.get("highlightId"); // 하이라이트할 상담 ID

  if (!companyId || !page) {
    return NextResponse.json(
      { message: "Missing required parameters: companyId or page" },
      { status: 400 }
    );
  }

  const consultationsPerPage = 4;
  let pageNumber = parseInt(page, 10);

  try {
    // 하이라이트 ID가 있으면 해당 상담이 있는 페이지 찾기
    if (highlightId && !search) {
      // 해당 상담의 created_at 가져오기
      const { data: targetConsultation } = await supabase
        .from("consultations")
        .select("created_at")
        .eq("id", highlightId)
        .eq("company_id", companyId)
        .single();

      if (targetConsultation) {
        // 해당 상담보다 최신인 상담 수 계산 (같은 회사)
        const { count: newerCount } = await supabase
          .from("consultations")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .gt("created_at", targetConsultation.created_at);

        // 페이지 계산 (0-indexed count + 1로 position, 그걸 페이지로 변환)
        const position = (newerCount || 0) + 1;
        pageNumber = Math.ceil(position / consultationsPerPage);
      }
    }

    const from = (pageNumber - 1) * consultationsPerPage;
    const to = pageNumber * consultationsPerPage - 1;

    let query = supabase
      .from("consultations")
      .select(
        "id, date, title, content, contact_method, follow_up_date, user_id, documents(id, type, document_number, status), created_at",
        { count: "exact" }
      )
      .eq("company_id", companyId)
      .range(from, to)
      .order("created_at", { ascending: false });

    // 검색어가 있는 경우 (콤마로 구분된 여러 검색어 지원 - AND 조건)
    // "a,b" 검색 시 a도 포함하고 b도 포함하는 결과만 반환
    if (search) {
      const searchTerms = search.split(",").map(term => term.trim()).filter(term => term.length > 0);

      searchTerms.forEach(term => {
        // 각 검색어는 제목 또는 내용에 포함되어야 함 (OR)
        // 여러 검색어는 모두 충족해야 함 (AND)
        query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);
      });
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        consultations: data,
        totalPages: count ? Math.ceil(count / consultationsPerPage) : 1,
        currentPage: pageNumber, // 실제 로드된 페이지 (highlightId로 변경될 수 있음)
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
