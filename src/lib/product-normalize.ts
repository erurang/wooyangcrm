/**
 * 제품명/규격 정규화 함수
 * document_items의 name/spec을 products의 internal_name/spec과 매칭할 때 사용
 */

/**
 * 제품명 정규화
 * - lowercase, trim, 공백정리, 하이픈→공백, 특수문자 제거
 */
export function normalizeProductName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .trim()
    .replace(/[-–—]/g, " ") // 하이픈 → 공백
    .replace(/[()[\]{}'"「」『』【】]/g, "") // 괄호/따옴표 제거
    .replace(/\s+/g, " ") // 다중 공백 → 단일 공백
    .trim();
}

/**
 * 규격 정규화
 * - lowercase, trim, 공백제거, x/X/×→x, 단위 소문자화, Φ/φ→ø
 */
export function normalizeSpec(spec: string): string {
  if (!spec) return "";
  return spec
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "") // 공백 전부 제거
    .replace(/[xX×＊\*]/g, "x") // 곱하기 기호 통일
    .replace(/[ΦφΦ]/g, "ø") // 파이 기호 통일
    .replace(/mm/g, "mm")
    .replace(/cm/g, "cm")
    .replace(/m(?!m)/g, "m")
    .replace(/kg/g, "kg")
    .replace(/g(?!$)/g, "g")
    .replace(/[lL](?=[^a-z]|$)/g, "l")
    .replace(/ml/g, "ml")
    .trim();
}

/**
 * 유사도 계산 (Levenshtein distance 기반)
 * 반환값: 0.0 ~ 1.0 (1.0 = 완전 일치)
 */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const lenA = a.length;
  const lenB = b.length;
  const maxLen = Math.max(lenA, lenB);
  if (maxLen === 0) return 1;

  // Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= lenA; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= lenB; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return 1 - matrix[lenA][lenB] / maxLen;
}

/**
 * 제품명 + 규격 종합 매칭 점수
 * 반환값: 0.0 ~ 1.0
 */
export function matchScore(
  itemName: string,
  itemSpec: string | null,
  productName: string,
  productSpec: string | null
): number {
  const normItemName = normalizeProductName(itemName);
  const normProductName = normalizeProductName(productName);

  // 이름 유사도 (가중치 70%)
  const nameSim = similarity(normItemName, normProductName);

  // 규격 유사도 (가중치 30%)
  const normItemSpec = normalizeSpec(itemSpec || "");
  const normProductSpec = normalizeSpec(productSpec || "");

  let specSim: number;
  if (!normItemSpec && !normProductSpec) {
    specSim = 1; // 둘 다 없으면 일치로 간주
  } else if (!normItemSpec || !normProductSpec) {
    specSim = 0.5; // 한쪽만 있으면 중립
  } else {
    specSim = similarity(normItemSpec, normProductSpec);
  }

  return nameSim * 0.7 + specSim * 0.3;
}

/**
 * 매칭 티어 판별
 */
export type MatchTier = "exact" | "normalized" | "fuzzy" | "no_match";

export interface MatchResult {
  productId: string;
  productName: string;
  productSpec: string | null;
  score: number;
  tier: MatchTier;
  matchedVia: "direct" | "alias" | "normalized";
}

export function getMatchTier(score: number): MatchTier {
  if (score >= 1.0) return "exact";
  if (score >= 0.8) return "normalized";
  if (score >= 0.5) return "fuzzy";
  return "no_match";
}
