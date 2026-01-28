import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * 제품 검색 API (별칭 포함, 페이지네이션 지원)
 * GET /api/products/search?q=검색어&company_id=xxx&type=order&page=1&pageSize=20
 *
 * @param q - 검색어 (제품명, 제품코드, 별칭 검색)
 * @param company_id - 거래처 ID (해당 거래처의 별칭 우선 표시)
 * @param type - 문서 유형 (order=발주/매입, estimate=견적/매출)
 * @param page - 페이지 번호 (기본: 1)
 * @param pageSize - 페이지당 개수 (기본: 20)
 * @param limit - 결과 개수 제한 (레거시, pageSize 우선)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const companyId = searchParams.get("company_id");
    const docType = searchParams.get("type"); // order | estimate
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = parseInt(searchParams.get("pageSize") || searchParams.get("limit") || "20", 10);

    // alias_type 결정: order=매입(purchase), estimate=매출(sales)
    const aliasType = docType === "order" ? "purchase" : "sales";

    // 페이지네이션 계산
    const offset = (page - 1) * pageSize;

    // 1. 전체 개수 조회 (페이지네이션용)
    let countQuery = supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .or("is_active.eq.true,is_active.is.null");

    if (query) {
      countQuery = countQuery.or(
        `internal_name.ilike.%${query}%,internal_code.ilike.%${query}%,spec.ilike.%${query}%`
      );
    }

    const { count: totalCount } = await countQuery;

    // 2. 제품 검색 (내부명, 코드) - 기본 가나다순 정렬
    let productsQuery = supabase
      .from("products")
      .select(`
        id,
        internal_code,
        internal_name,
        type,
        category,
        spec,
        unit,
        current_stock,
        unit_price,
        is_active
      `)
      // is_active가 true이거나 null인 경우 모두 포함 (null은 기본값으로 true 취급)
      .or("is_active.eq.true,is_active.is.null")
      .order("internal_name", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (query) {
      productsQuery = productsQuery.or(
        `internal_name.ilike.%${query}%,internal_code.ilike.%${query}%,spec.ilike.%${query}%`
      );
    }

    const { data: products, error: productsError } = await productsQuery;

    console.log("[ProductSearch] query:", query, "found products:", products?.length || 0);

    if (productsError) {
      console.error("[ProductSearch] Products search error:", productsError);
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    // 2. 별칭 검색 (거래처별 외부 이름)
    // alias_type 컬럼이 없을 수 있으므로 try-catch로 처리
    let aliases: any[] | null = null;

    try {
      let aliasesQuery = supabase
        .from("company_product_aliases")
        .select(`
          id,
          product_id,
          company_id,
          alias_type,
          external_code,
          external_name,
          external_spec,
          external_unit,
          external_unit_price,
          use_count,
          is_default
        `)
        .order("use_count", { ascending: false, nullsFirst: false })
        .limit(100);

      // alias_type 필터 (컬럼이 있는 경우에만)
      aliasesQuery = aliasesQuery.eq("alias_type", aliasType);

      if (query) {
        aliasesQuery = aliasesQuery.or(
          `external_name.ilike.%${query}%,external_code.ilike.%${query}%`
        );
      }

      // 특정 거래처가 있으면 해당 거래처 별칭 우선
      if (companyId) {
        aliasesQuery = aliasesQuery.eq("company_id", companyId);
      }

      const { data, error: aliasesError } = await aliasesQuery;

      if (aliasesError) {
        // alias_type 컬럼이 없으면 컬럼 없이 재시도
        if (aliasesError.message.includes("alias_type")) {
          const fallbackQuery = supabase
            .from("company_product_aliases")
            .select(`
              id,
              product_id,
              company_id,
              external_code,
              external_name,
              external_spec,
              external_unit_price
            `)
            .limit(100);

          const { data: fallbackData } = await fallbackQuery;
          aliases = fallbackData;
        } else {
          console.error("Aliases search error:", aliasesError);
        }
      } else {
        aliases = data;
      }
    } catch (e) {
      console.error("Aliases search error:", e);
      // 별칭 검색 실패해도 제품 결과는 반환
    }

    // 3. 결과 조합
    const aliasMap = new Map<string, typeof aliases>();
    if (aliases) {
      for (const alias of aliases) {
        const existing = aliasMap.get(alias.product_id) || [];
        existing.push(alias);
        aliasMap.set(alias.product_id, existing);
      }
    }

    // 제품에 별칭 정보 추가
    const results = (products || []).map((product) => {
      const productAliases = aliasMap.get(product.id) || [];
      return {
        ...product,
        aliases: productAliases,
        // 해당 거래처의 기본 별칭이 있으면 추천 표시
        recommended_alias: productAliases.find((a) => a.is_default) || productAliases[0] || null,
      };
    });

    // 4. 별칭으로만 검색된 제품 추가 (products 검색에 안 걸린 경우)
    if (aliases && query) {
      const productIds = new Set(results.map((r) => r.id));
      const aliasOnlyProductIds = [...new Set(aliases.map((a) => a.product_id))]
        .filter((id) => !productIds.has(id));

      if (aliasOnlyProductIds.length > 0) {
        const { data: aliasProducts } = await supabase
          .from("products")
          .select(`
            id,
            internal_code,
            internal_name,
            type,
            category,
            spec,
            unit,
            current_stock,
            unit_price,
            is_active
          `)
          .in("id", aliasOnlyProductIds)
          .or("is_active.eq.true,is_active.is.null");

        if (aliasProducts) {
          for (const product of aliasProducts) {
            const productAliases = aliasMap.get(product.id) || [];
            results.push({
              ...product,
              aliases: productAliases,
              recommended_alias: productAliases.find((a) => a.is_default) || productAliases[0] || null,
            });
          }
        }
      }
    }

    // 결과 정렬: 별칭 있는 제품 우선, 사용 횟수 높은 순
    results.sort((a, b) => {
      const aHasAlias = a.aliases.length > 0 ? 1 : 0;
      const bHasAlias = b.aliases.length > 0 ? 1 : 0;
      if (aHasAlias !== bHasAlias) return bHasAlias - aHasAlias;

      const aUseCount = a.recommended_alias?.use_count || 0;
      const bUseCount = b.recommended_alias?.use_count || 0;
      return bUseCount - aUseCount;
    });

    return NextResponse.json({
      products: results,
      total: totalCount || results.length,
      page,
      pageSize,
      totalPages: Math.ceil((totalCount || results.length) / pageSize),
    });
  } catch (error) {
    console.error("Product search error:", error);
    return NextResponse.json(
      { error: "제품 검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
