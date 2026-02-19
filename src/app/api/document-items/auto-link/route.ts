import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import {
  normalizeProductName,
  normalizeSpec,
  matchScore,
  getMatchTier,
  type MatchTier,
} from "@/lib/product-normalize";

interface UnlinkedGroup {
  name: string;
  spec: string | null;
  count: number;
}

interface MatchCandidate {
  productId: string;
  productName: string;
  productSpec: string | null;
  productCode: string;
  score: number;
  tier: MatchTier;
  matchedVia: "direct" | "alias";
}

interface AutoLinkResult {
  name: string;
  spec: string | null;
  count: number;
  match: MatchCandidate | null;
  tier: MatchTier;
}

/**
 * POST /api/document-items/auto-link
 *
 * 자동 매핑 API
 * body: { dry_run: boolean, user_id?: string, min_score?: number }
 *
 * dry_run=true: 매칭 미리보기만 (실제 연결 안 함)
 * dry_run=false: 실제 연결 수행 (Tier 1, 2만)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dry_run = true, user_id, min_score = 0.8 } = body;

    // 1. 모든 제품 + aliases 로드
    const { data: products, error: prodError } = await supabase
      .from("products")
      .select("id, internal_code, internal_name, spec, is_active")
      .or("is_active.is.null,is_active.eq.true");

    if (prodError) throw prodError;

    const { data: aliases, error: aliasError } = await supabase
      .from("company_product_aliases")
      .select("id, product_id, external_name, external_spec, company_id");

    if (aliasError) throw aliasError;

    // 2. 미연결 품목 그룹 조회 (2018년 이후)
    const { data: rawItems, error: itemsError } = await supabase
      .from("document_items")
      .select(`
        name,
        spec,
        document:documents!inner (type, date)
      `)
      .is("product_id", null)
      .gte("document.date", "2018-01-01")
      .range(0, 9999);

    if (itemsError) throw itemsError;

    // 그룹화
    const groupMap = new Map<string, UnlinkedGroup>();
    for (const item of rawItems || []) {
      const key = `${item.name}|||${item.spec || ""}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, { name: item.name, spec: item.spec, count: 0 });
      }
      groupMap.get(key)!.count++;
    }

    const groups = Array.from(groupMap.values());

    // 3. 정규화된 매칭 인덱스 구축
    // 제품 직접 매칭용
    const productIndex = (products || []).map((p) => ({
      id: p.id,
      code: p.internal_code,
      name: p.internal_name,
      spec: p.spec,
      normName: normalizeProductName(p.internal_name),
      normSpec: normalizeSpec(p.spec || ""),
    }));

    // Alias 매칭용
    const aliasIndex = (aliases || []).map((a) => ({
      productId: a.product_id,
      externalName: a.external_name,
      externalSpec: a.external_spec,
      normName: normalizeProductName(a.external_name),
      normSpec: normalizeSpec(a.external_spec || ""),
      companyId: a.company_id,
    }));

    // 4. 각 그룹에 대해 최적 매칭 찾기
    const results: AutoLinkResult[] = [];
    const tier1: AutoLinkResult[] = []; // 정확 일치 (score === 1.0)
    const tier2: AutoLinkResult[] = []; // 정규화 일치 (score >= 0.8)
    const tier3: AutoLinkResult[] = []; // 부분 일치 (score < 0.8)
    const noMatch: AutoLinkResult[] = [];

    for (const group of groups) {
      const normGroupName = normalizeProductName(group.name);
      const normGroupSpec = normalizeSpec(group.spec || "");
      let bestMatch: MatchCandidate | null = null;

      // Step 1: Alias에서 정확 일치 찾기
      for (const alias of aliasIndex) {
        if (alias.normName === normGroupName) {
          const specMatch = !normGroupSpec && !alias.normSpec
            ? true
            : normGroupSpec === alias.normSpec;
          if (specMatch) {
            const product = productIndex.find((p) => p.id === alias.productId);
            if (product) {
              bestMatch = {
                productId: product.id,
                productName: product.name,
                productSpec: product.spec,
                productCode: product.code,
                score: 1.0,
                tier: "exact",
                matchedVia: "alias",
              };
              break;
            }
          }
        }
      }

      // Step 2: 제품에서 직접 매칭
      if (!bestMatch || bestMatch.score < 1.0) {
        for (const product of productIndex) {
          const score = matchScore(
            group.name,
            group.spec,
            product.name,
            product.spec
          );

          if (score > (bestMatch?.score || 0)) {
            bestMatch = {
              productId: product.id,
              productName: product.name,
              productSpec: product.spec,
              productCode: product.code,
              score,
              tier: getMatchTier(score),
              matchedVia: "direct",
            };
            if (score === 1.0) break;
          }
        }
      }

      // Step 3: Alias에서 fuzzy 매칭
      if (!bestMatch || bestMatch.score < 0.8) {
        for (const alias of aliasIndex) {
          const score = matchScore(
            group.name,
            group.spec,
            alias.externalName,
            alias.externalSpec
          );

          if (score > (bestMatch?.score || 0)) {
            const product = productIndex.find((p) => p.id === alias.productId);
            if (product) {
              bestMatch = {
                productId: product.id,
                productName: product.name,
                productSpec: product.spec,
                productCode: product.code,
                score,
                tier: getMatchTier(score),
                matchedVia: "alias",
              };
            }
          }
        }
      }

      const result: AutoLinkResult = {
        name: group.name,
        spec: group.spec,
        count: group.count,
        match: bestMatch && bestMatch.score >= 0.5 ? bestMatch : null,
        tier: bestMatch ? getMatchTier(bestMatch.score) : "no_match",
      };

      results.push(result);

      if (bestMatch && bestMatch.score >= 1.0) {
        tier1.push(result);
      } else if (bestMatch && bestMatch.score >= min_score) {
        tier2.push(result);
      } else if (bestMatch && bestMatch.score >= 0.5) {
        tier3.push(result);
      } else {
        noMatch.push(result);
      }
    }

    // 5. dry_run이 아니면 실제 연결 수행
    let linkedCount = 0;
    let linkedGroups = 0;
    const linkErrors: string[] = [];

    if (!dry_run) {
      const toLink = [...tier1, ...tier2];

      for (const result of toLink) {
        if (!result.match) continue;

        try {
          // 제품 정보 조회
          const product = productIndex.find((p) => p.id === result.match!.productId);
          if (!product) continue;

          // 일괄 연결
          let query = supabase
            .from("document_items")
            .update({
              product_id: result.match.productId,
              internal_name: product.name,
              internal_spec: product.spec,
            })
            .eq("name", result.name)
            .is("product_id", null);

          if (result.spec) {
            query = query.eq("spec", result.spec);
          } else {
            query = query.is("spec", null);
          }

          const { data: updated, error: updateError } = await query.select("id");

          if (updateError) {
            linkErrors.push(`${result.name}: ${updateError.message}`);
          } else {
            const count = updated?.length || 0;
            linkedCount += count;
            if (count > 0) linkedGroups++;
          }

          // Alias가 없으면 자동 생성 (문서에 company 정보가 있는 경우)
          // 이건 비동기로 처리 - 실패해도 무시
          if (result.match.matchedVia === "direct") {
            // 해당 그룹의 아이템에서 고유한 company_id들 추출
            const { data: itemsWithCompany } = await supabase
              .from("document_items")
              .select(`
                document:documents!inner (company_id)
              `)
              .eq("name", result.name)
              .eq("product_id", result.match.productId)
              .limit(100);

            if (itemsWithCompany) {
              const companyIds = new Set<string>();
              for (const item of itemsWithCompany) {
                const doc = Array.isArray(item.document)
                  ? item.document[0]
                  : item.document;
                if (doc?.company_id) companyIds.add(doc.company_id);
              }

              for (const companyId of companyIds) {
                // 이미 alias가 있는지 확인
                const { data: existingAlias } = await supabase
                  .from("company_product_aliases")
                  .select("id")
                  .eq("company_id", companyId)
                  .eq("product_id", result.match!.productId)
                  .eq("external_name", result.name)
                  .maybeSingle();

                if (!existingAlias) {
                  await supabase.from("company_product_aliases").insert({
                    company_id: companyId,
                    product_id: result.match!.productId,
                    alias_type: "purchase",
                    external_name: result.name,
                    external_spec: result.spec,
                    is_default: false,
                    use_count: result.count,
                  }).then(() => {});
                }
              }
            }
          }
        } catch (e) {
          linkErrors.push(`${result.name}: ${String(e)}`);
        }
      }

      // 로그 기록
      if (linkedCount > 0) {
        await supabase.from("logs").insert({
          table_name: "document_items",
          operation: "AUTO_LINK",
          record_id: null,
          old_data: null,
          new_data: {
            linked_count: linkedCount,
            linked_groups: linkedGroups,
            tier1_count: tier1.length,
            tier2_count: tier2.length,
          },
          changed_by: user_id || null,
        });
      }
    }

    return NextResponse.json({
      dry_run,
      summary: {
        totalGroups: groups.length,
        totalItems: groups.reduce((sum, g) => sum + g.count, 0),
        tier1: { groups: tier1.length, items: tier1.reduce((s, r) => s + r.count, 0) },
        tier2: { groups: tier2.length, items: tier2.reduce((s, r) => s + r.count, 0) },
        tier3: { groups: tier3.length, items: tier3.reduce((s, r) => s + r.count, 0) },
        noMatch: { groups: noMatch.length, items: noMatch.reduce((s, r) => s + r.count, 0) },
      },
      results: {
        tier1: tier1.map(formatResult),
        tier2: tier2.map(formatResult),
        tier3: tier3.map(formatResult),
        noMatch: noMatch.map(formatResult),
      },
      ...(dry_run
        ? {}
        : { linked: { count: linkedCount, groups: linkedGroups, errors: linkErrors } }),
    });
  } catch (error) {
    console.error("자동 매핑 에러:", error);
    return NextResponse.json(
      { error: "자동 매핑 중 오류가 발생했습니다", details: String(error) },
      { status: 500 }
    );
  }
}

function formatResult(r: AutoLinkResult) {
  return {
    name: r.name,
    spec: r.spec,
    count: r.count,
    match: r.match
      ? {
          productId: r.match.productId,
          productName: r.match.productName,
          productSpec: r.match.productSpec,
          productCode: r.match.productCode,
          score: Math.round(r.match.score * 100),
          matchedVia: r.match.matchedVia,
        }
      : null,
  };
}
