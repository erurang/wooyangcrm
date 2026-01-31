import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// 타입 정의
interface DocumentBasic {
  type: string;
  date: string;
}

interface DocumentWithCompany {
  id: string;
  document_number: string;
  type: string;
  date: string;
  company_id: string;
  company: {
    id: string;
    name: string;
  } | null;
}

interface BaseItem {
  name: string;
  spec: string | null;
  document: DocumentBasic | null;
}

interface DetailItem {
  id: string;
  document_id: string;
  item_number: number;
  name: string;
  spec: string | null;
  quantity: string;
  unit: string | null;
  unit_price: number;
  amount: number;
  product_id: string | null;
  document: DocumentWithCompany | null;
}

/**
 * 미연결 품목 조회 API (전체 조회)
 * GET /api/document-items/unlinked?doc_type=order|estimate&search=검색어
 *
 * 1단계: 고유 품명+규격 그룹 조회
 * 2단계: 각 그룹에 해당하는 개별 항목 조회
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get("doc_type"); // order | estimate | null (전체)
    const search = searchParams.get("search");

    // 2018년 이후 데이터만 조회
    const startDate = "2018-01-01";

    // 먼저 정확한 전체 개수 조회 (Supabase 기본 1000개 제한 우회)
    const { count: totalCount } = await supabase
      .from("document_items")
      .select("id", { count: "exact", head: true })
      .is("product_id", null);

    // 1단계: 2018년 이후 문서의 미연결 품목만 조회
    // documents 테이블과 inner join으로 date 필터 적용
    let baseQuery = supabase
      .from("document_items")
      .select(`
        name,
        spec,
        document:documents!inner (
          type,
          date
        )
      `)
      .is("product_id", null)
      .gte("document.date", startDate)
      .range(0, 9999);

    // 문서 유형 필터
    if (docType) {
      baseQuery = baseQuery.eq("document.type", docType);
    }

    // 검색 필터
    if (search) {
      baseQuery = baseQuery.or(`name.ilike.%${search}%,spec.ilike.%${search}%`);
    }

    const { data: rawItems, error: baseError } = await baseQuery;

    if (baseError) {
      throw new Error(`그룹 조회 실패: ${baseError.message}`);
    }

    // Supabase는 1:1 관계도 배열로 반환할 수 있으므로 정규화
    const allItems: BaseItem[] = (rawItems || []).map((item) => ({
      name: item.name,
      spec: item.spec,
      document: Array.isArray(item.document) ? item.document[0] || null : item.document,
    }));

    // DB에서 이미 2018년 이후 + 문서유형 필터 적용됨
    const filteredItems = allItems;

    // 고유 그룹 추출
    const groupMap = new Map<string, { name: string; spec: string | null; count: number; docTypes: Set<string> }>();

    for (const item of filteredItems) {
      const key = `${item.name}|||${item.spec || ""}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          name: item.name,
          spec: item.spec,
          count: 0,
          docTypes: new Set(),
        });
      }
      const group = groupMap.get(key)!;
      group.count++;
      if (item.document?.type) {
        group.docTypes.add(item.document.type);
      }
    }

    // 그룹을 이름순으로 정렬
    const sortedGroups = Array.from(groupMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "ko")
    );

    const totalGroups = sortedGroups.length;
    const totalItems = filteredItems.length;

    // 전체 그룹 상세 정보 조회 (페이지네이션 없음)
    const groupsWithDetails = await Promise.all(
      sortedGroups.map(async (group) => {
        // 해당 그룹의 상세 항목 조회 (2018년 이후, 최대 30개)
        let itemQuery = supabase
          .from("document_items")
          .select(`
            id,
            document_id,
            item_number,
            name,
            spec,
            quantity,
            unit,
            unit_price,
            amount,
            product_id,
            document:documents!inner (
              id,
              document_number,
              type,
              date,
              company_id,
              company:companies!documents_company_id_fkey (
                id,
                name
              )
            )
          `)
          .is("product_id", null)
          .eq("name", group.name)
          .gte("document.date", startDate)
          .order("document(date)", { ascending: false })
          .limit(30);

        if (group.spec) {
          itemQuery = itemQuery.eq("spec", group.spec);
        } else {
          itemQuery = itemQuery.is("spec", null);
        }

        const { data: rawDetailItems } = await itemQuery;

        // Supabase 관계 정규화 + 거래처 목록 추출
        const companies = new Set<string>();
        const detailItems: DetailItem[] = (rawDetailItems || []).map((item) => {
          const doc = Array.isArray(item.document) ? item.document[0] : item.document;
          const company = doc && Array.isArray(doc.company) ? doc.company[0] : doc?.company;
          if (company?.name) {
            companies.add(company.name);
          }
          return {
            ...item,
            document: doc ? { ...doc, company: company || null } : null,
          } as DetailItem;
        });

        return {
          name: group.name,
          spec: group.spec,
          count: group.count,
          items: detailItems,
          docTypes: Array.from(group.docTypes),
          companies: Array.from(companies),
        };
      })
    );

    // 유형별 통계 계산 (2018년 이후)
    const orderItems = filteredItems.filter(item => item.document?.type === "order");
    const estimateItems = filteredItems.filter(item => item.document?.type === "estimate");

    return NextResponse.json({
      grouped: groupsWithDetails,
      total: totalItems,               // 2018년 이후 (필터 적용)
      totalGroups,
      totalUnlinkedAll: totalCount || 0, // DB 전체 미연결 품목 수 (모든 기간)
      stats: {
        order: orderItems.length,        // 2018년 이후 발주서 품목 수
        estimate: estimateItems.length,  // 2018년 이후 견적서 품목 수
      },
      dateRange: "2018-01-01 ~",         // 조회 기간 표시
    });
  } catch (error) {
    console.error("미연결 품목 조회 에러:", error);
    return NextResponse.json(
      { error: "미연결 품목 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
