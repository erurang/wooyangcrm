import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface DocumentResult {
  id: string;
  document_number: string;
  type: string;
  company_name: string;
  created_at: string;
}

interface ConsultationResult {
  id: string;
  title: string;
  company_name: string;
  created_at: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") || "";
    const type = searchParams.get("type") || "all"; // document | consultation | all
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!keyword || keyword.length < 2) {
      return NextResponse.json(
        { documents: [], consultations: [] },
        { status: 200 }
      );
    }

    const results: {
      documents: DocumentResult[];
      consultations: ConsultationResult[];
    } = {
      documents: [],
      consultations: [],
    };

    // 문서 검색
    if (type === "all" || type === "document") {
      const { data: documents, error: docError } = await supabase
        .from("documents")
        .select(
          `
          id,
          document_number,
          type,
          created_at,
          company:companies!documents_company_id_fkey(name)
        `
        )
        .or(`document_number.ilike.%${keyword}%`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!docError && documents) {
        // 회사명으로도 검색
        const { data: docsByCompany } = await supabase
          .from("documents")
          .select(
            `
            id,
            document_number,
            type,
            created_at,
            company:companies!documents_company_id_fkey(name)
          `
          )
          .not("id", "in", `(${documents.map((d) => d.id).join(",") || "00000000-0000-0000-0000-000000000000"})`)
          .order("created_at", { ascending: false })
          .limit(limit);

        // 회사명 검색을 별도로 처리 (companies 테이블에서 먼저 검색)
        const { data: matchingCompanies } = await supabase
          .from("companies")
          .select("id, name")
          .ilike("name", `%${keyword}%`)
          .limit(20);

        const companyIds = matchingCompanies?.map((c) => c.id) || [];

        let companyDocuments: typeof documents = [];
        if (companyIds.length > 0) {
          const { data: docsByCompanyName } = await supabase
            .from("documents")
            .select(
              `
              id,
              document_number,
              type,
              created_at,
              company:companies!documents_company_id_fkey(name)
            `
            )
            .in("company_id", companyIds)
            .order("created_at", { ascending: false })
            .limit(limit);
          companyDocuments = docsByCompanyName || [];
        }

        // 중복 제거하면서 합치기
        const allDocs = [...documents, ...companyDocuments];
        const uniqueDocs = allDocs.filter(
          (doc, index, self) => index === self.findIndex((d) => d.id === doc.id)
        ).slice(0, limit);

        results.documents = uniqueDocs.map((doc) => ({
          id: doc.id,
          document_number: doc.document_number,
          type: doc.type,
          company_name: Array.isArray(doc.company)
            ? doc.company[0]?.name || "알 수 없음"
            : (doc.company as { name: string } | null)?.name || "알 수 없음",
          created_at: doc.created_at,
        }));
      }
    }

    // 상담 검색
    if (type === "all" || type === "consultation") {
      // 상담 제목으로 검색
      const { data: consultations, error: conError } = await supabase
        .from("consultations")
        .select(
          `
          id,
          title,
          created_at,
          company:companies!consultations_company_id_fkey(name)
        `
        )
        .ilike("title", `%${keyword}%`)
        .order("created_at", { ascending: false })
        .limit(limit);

      // 회사명으로도 검색
      const { data: matchingCompanies } = await supabase
        .from("companies")
        .select("id, name")
        .ilike("name", `%${keyword}%`)
        .limit(20);

      const companyIds = matchingCompanies?.map((c) => c.id) || [];

      let companyConsultations: typeof consultations = [];
      if (companyIds.length > 0) {
        const { data: consByCompanyName } = await supabase
          .from("consultations")
          .select(
            `
            id,
            title,
            created_at,
            company:companies!consultations_company_id_fkey(name)
          `
          )
          .in("company_id", companyIds)
          .order("created_at", { ascending: false })
          .limit(limit);
        companyConsultations = consByCompanyName || [];
      }

      // 중복 제거하면서 합치기
      const allCons = [...(consultations || []), ...(companyConsultations || [])];
      const uniqueCons = allCons.filter(
        (con, index, self) => index === self.findIndex((c) => c.id === con.id)
      ).slice(0, limit);

      if (!conError) {
        results.consultations = uniqueCons.map((con) => ({
          id: con.id,
          title: con.title || "제목 없음",
          company_name: Array.isArray(con.company)
            ? con.company[0]?.name || "알 수 없음"
            : (con.company as { name: string } | null)?.name || "알 수 없음",
          created_at: con.created_at,
        }));
      }
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Error searching related documents:", error);
    return NextResponse.json(
      { error: "검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
