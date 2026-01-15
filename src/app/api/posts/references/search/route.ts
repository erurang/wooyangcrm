import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import dayjs from "dayjs";

interface ReferenceSearchItem {
  id: string;
  name: string;
  type: "company" | "consultation" | "document";
  subtext?: string;
  // 상담용 추가 정보
  content?: string;
  userName?: string;
  date?: string;
}

/**
 * GET /api/posts/references/search
 * 참조 가능한 항목 검색 (회사, 상담, 문서)
 * Query params:
 *   - q: 검색어 (선택, 회사 검색 시 필수)
 *   - type: 검색 타입 (선택, 'company' | 'consultation' | 'document')
 *   - companyId: 회사 ID (선택, 상담/문서 필터링용)
 *   - consultationId: 상담 ID (선택, 문서 필터링용)
 *   - limit: 결과 수 제한 (선택, 기본 20)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "company";
    const companyId = searchParams.get("companyId");
    const consultationId = searchParams.get("consultationId");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const results: ReferenceSearchItem[] = [];

    // 회사 검색 (검색어 필수)
    if (type === "company") {
      if (!query || query.length < 1) {
        return NextResponse.json({ results: [] });
      }

      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, business_number")
        .ilike("name", `%${query}%`)
        .limit(limit);

      if (companies) {
        results.push(
          ...companies.map((c) => ({
            id: c.id,
            name: c.name,
            type: "company" as const,
            subtext: c.business_number || undefined,
          }))
        );
      }
    }

    // 상담 검색/조회 (companyId로 필터링)
    if (type === "consultation") {
      if (!companyId) {
        return NextResponse.json({ results: [], error: "companyId가 필요합니다." });
      }

      let consultationQuery = supabase
        .from("consultations")
        .select(`
          id,
          title,
          content,
          date,
          created_at,
          user:users(id, name),
          company:companies(name)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(limit);

      // 검색어가 있으면 제목 또는 내용으로 필터링
      if (query) {
        consultationQuery = consultationQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
      }

      const { data: consultations } = await consultationQuery;

      if (consultations) {
        results.push(
          ...consultations.map((c: any) => ({
            id: c.id,
            name: c.title || "(제목 없음)",
            type: "consultation" as const,
            subtext: c.user?.name || "담당자 없음",
            content: c.content ? (c.content.length > 100 ? c.content.substring(0, 100) + "..." : c.content) : "",
            userName: c.user?.name || "",
            date: c.date || c.created_at,
          }))
        );
      }
    }

    // 문서 검색/조회 (companyId 또는 consultationId로 필터링)
    if (type === "document") {
      // consultationId가 있으면 해당 상담의 문서만, 없으면 회사의 모든 문서
      if (!companyId && !consultationId) {
        return NextResponse.json({ results: [], error: "companyId 또는 consultationId가 필요합니다." });
      }

      let documentQuery = supabase
        .from("documents")
        .select("id, document_number, type, created_at, company:companies(name), consultation_id")
        .order("created_at", { ascending: false })
        .limit(limit);

      // consultationId가 있으면 해당 상담의 문서만
      if (consultationId) {
        documentQuery = documentQuery.eq("consultation_id", consultationId);
      } else if (companyId) {
        documentQuery = documentQuery.eq("company_id", companyId);
      }

      // 검색어가 있으면 문서번호로 필터링
      if (query) {
        documentQuery = documentQuery.ilike("document_number", `%${query}%`);
      }

      const { data: documents } = await documentQuery;

      if (documents) {
        results.push(
          ...documents.map((d: any) => ({
            id: d.id,
            name: d.document_number || "(문서번호 없음)",
            type: "document" as const,
            subtext: `${d.type || "문서"} · ${dayjs(d.created_at).format("YYYY-MM-DD")}`,
          }))
        );
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Reference search error:", error);
    return NextResponse.json(
      { error: "검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
