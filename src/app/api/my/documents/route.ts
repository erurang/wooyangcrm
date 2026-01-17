import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET: 유저가 생성한 문서 목록
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const type = searchParams.get("type") || "all"; // all, quotation, order
  const status = searchParams.get("status") || "all";
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // 기본 쿼리
  let query = supabase
    .from("documents")
    .select(
      `
      id,
      type,
      status,
      created_at,
      document_number,
      total_amount,
      valid_until,
      delivery_date,
      content,
      company_id,
      consultation_id,
      companies (
        id,
        name
      )
    `,
      { count: "exact" }
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // 타입 필터
  if (type !== "all") {
    query = query.eq("type", type);
  }

  // 상태 필터
  if (status !== "all") {
    query = query.eq("status", status);
  }

  // 검색 (회사명으로)
  // 검색은 content.company_name에서 수행
  // Supabase에서 JSONB 검색이 복잡하므로 회사 테이블을 통해 검색

  // 페이지네이션
  query = query.range(offset, offset + limit - 1);

  const { data: documents, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 검색 필터 (클라이언트 사이드)
  let filteredDocs = documents || [];
  if (search) {
    const searchLower = search.toLowerCase();
    filteredDocs = filteredDocs.filter((doc: any) => {
      const companyName = doc.companies?.name?.toLowerCase() || "";
      const contentCompanyName =
        doc.content?.company_name?.toLowerCase() || "";
      return (
        companyName.includes(searchLower) ||
        contentCompanyName.includes(searchLower)
      );
    });
  }

  // 문서 데이터 변환
  const processedDocs = filteredDocs.map((doc: any) => ({
    id: doc.id,
    type: doc.type,
    status: doc.status,
    created_at: doc.created_at,
    document_number: doc.document_number,
    total_amount: doc.total_amount || doc.content?.total_amount || 0,
    valid_until: doc.valid_until,
    delivery_date: doc.delivery_date,
    company_name: doc.companies?.name || doc.content?.company_name || "회사명 없음",
    company_id: doc.company_id,
    consultation_id: doc.consultation_id,
  }));

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    documents: processedDocs,
    total,
    page,
    limit,
    totalPages,
  });
}
