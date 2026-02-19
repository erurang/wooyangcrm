# WooyangCRM 재고 통합 관리 시스템 구현 리포트

**작성일**: 2026-02-19
**범위**: 제품 자동 매핑 + 문서→재고 자동화 + 수동 재고 조정
**상태**: 완료
**브랜치**: dev

---

## 1. 작업 요약

### 1.1 Phase 1: 제품 자동 매핑

**문제**: document_items의 product_id가 대부분 NULL - 제품 연결이 안 되어 있어 재고 추적 불가능

**해결**:
- 정규화 함수 생성 (이름/규격 표준화)
- 3단계 자동 매칭 API (정확 → 유사 → 수동 검토)
- 매핑 페이지에 "자동 매핑" 버튼 + 미리보기/실행 UI

### 1.2 Phase 2: 문서 완료 → 재고 자동화

**문제**: 문서(발주/견적) 완료 시 재고 처리가 전혀 자동화되어 있지 않음

**해결**:
- 발주서 완료 → 자동 입고 (LOT 생성 + stock 증가)
- 견적서 완료 → 자동 출고 (FIFO LOT 차감 + stock 감소)
- 문서 상태 변경 API에 비차단 연동

### 1.3 Phase 3: 수동 재고 조정

**문제**: 실사, 파손, 오류 등으로 재고를 수동 조정할 방법이 없음

**해결**:
- 증가/감소 지원하는 조정 API
- 사유 필수 입력
- LOT 생성(증가) / FIFO 차감(감소)

---

## 2. 신규 파일 목록

| 파일 | 설명 |
|------|------|
| `src/lib/product-normalize.ts` | 제품명/규격 정규화 + 유사도 계산 |
| `src/app/api/document-items/auto-link/route.ts` | 자동 매핑 API (dry_run/실행) |
| `src/lib/inventory/automation.ts` | 재고 자동화 핵심 로직 |
| `src/app/api/inventory/adjust/route.ts` | 수동 재고 조정 API |

## 3. 수정된 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/app/api/documents/status/route.ts` | 문서 완료 시 재고 자동 처리 호출 추가 |
| `src/app/products/mapping/page.tsx` | 자동 매핑 버튼 + 미리보기 모달 UI 추가 |

---

## 4. 상세 구현

### 4.1 정규화 함수 (`product-normalize.ts`)

```typescript
normalizeProductName(name)
// "SAMPLE-Product (A)" → "sample product a"
// lowercase, 하이픈→공백, 괄호 제거, 다중공백 정리

normalizeSpec(spec)
// "100 X 200 MM" → "100x200mm"
// lowercase, 공백제거, x/X/×→x, 단위 소문자화

similarity(a, b) → 0.0~1.0
// Levenshtein distance 기반 유사도

matchScore(itemName, itemSpec, productName, productSpec) → 0.0~1.0
// 이름 70% + 규격 30% 가중 종합 점수
```

### 4.2 자동 매핑 API (`/api/document-items/auto-link`)

**엔드포인트**: `POST /api/document-items/auto-link`

**요청**:
```json
{
  "dry_run": true,        // true: 미리보기만, false: 실제 연결
  "user_id": "uuid",      // 실행 시 필요
  "min_score": 0.8         // 자동 연결 최소 점수 (기본 0.8)
}
```

**매칭 로직**:
1. 전체 products + company_product_aliases 로드
2. 미연결 document_items를 (name+spec) 그룹화
3. 각 그룹에 대해 3단계 매칭:
   - **Tier 1 (score=1.0)**: Alias 정확 일치 또는 제품명 정확 일치 → 자동 연결
   - **Tier 2 (score≥0.8)**: 정규화 후 유사 매칭 → 자동 연결
   - **Tier 3 (score<0.8)**: 부분 매칭 → 수동 검토 권장
4. 연결 시 company_product_aliases 자동 생성

**응답**:
```json
{
  "dry_run": true,
  "summary": {
    "totalGroups": 150,
    "tier1": { "groups": 45, "items": 320 },
    "tier2": { "groups": 28, "items": 180 },
    "tier3": { "groups": 42, "items": 210 },
    "noMatch": { "groups": 35, "items": 90 }
  },
  "results": {
    "tier1": [...],
    "tier2": [...],
    "tier3": [...],
    "noMatch": [...]
  }
}
```

### 4.3 재고 자동화 (`inventory/automation.ts`)

**함수**: `processDocumentCompletion(documentId, userId)`

**발주서(order) 완료 → 입고 흐름**:
1. `inventory_tasks` 생성 (task_type: "inbound")
2. product_id 있는 document_items 각각:
   - `inventory_lots` 생성 (source_type: "purchase", LOT 번호 자동생성)
   - `lot_transactions` 기록 (type: "inbound")
   - `products.current_stock` += quantity
   - `product_transactions` 기록
3. inventory_task → completed 상태로 변경

**견적서(estimate) 완료 → 출고 흐름**:
1. `inventory_tasks` 생성 (task_type: "outbound")
2. product_id 있는 document_items 각각:
   - FIFO로 available LOT 차감 (가장 오래된 LOT부터)
   - LOT 소진 시 status → "depleted"
   - `lot_transactions` 기록 (type: "outbound")
   - `products.current_stock` -= quantity
   - `product_transactions` 기록
3. 재고 부족 시: **경고만, 차단하지 않음** (가능한 만큼만 차감)

**문서 상태 API 연동**:
```typescript
// /api/documents/status PATCH
if (status === "completed" && (type === "order" || type === "estimate")) {
  try {
    inventoryResult = await processDocumentCompletion(id, updated_by);
  } catch (invError) {
    // 비차단: 재고 실패해도 문서 상태 변경은 성공
    console.error("재고 자동 처리 예외:", invError);
  }
}
```

### 4.4 수동 재고 조정 API (`/api/inventory/adjust`)

**엔드포인트**: `POST /api/inventory/adjust`

**요청**:
```json
{
  "product_id": "uuid",
  "adjustment_type": "increase" | "decrease",
  "quantity": 100,
  "reason": "실사 차이 보정",
  "notes": "2026년 2월 정기 실사",
  "user_id": "uuid"
}
```

**증가 시**:
- 새 LOT 생성 (source_type: "adjust")
- lot_transaction 기록
- products.current_stock += quantity
- product_transactions 기록

**감소 시**:
- 재고 부족 체크 (부족 시 400 에러)
- FIFO LOT 차감
- LOT 소진 시 status → "depleted"
- products.current_stock -= quantity
- product_transactions 기록

---

## 5. 데이터 흐름도

```
[문서 생성] → [품목 입력] → [자동 매핑] → [제품 연결]
                                              ↓
[문서 완료] ─────────────────────────→ [재고 자동 처리]
                                              ↓
                    ┌─── 발주서(order) ───→ 입고: LOT 생성 + stock 증가
                    └─── 견적서(estimate) → 출고: FIFO 차감 + stock 감소
                                              ↓
                                    [inventory_tasks: completed]
                                    [lot_transactions: 기록]
                                    [product_transactions: 기록]

[수동 조정] → 증가: LOT 생성 + stock 증가
            → 감소: FIFO 차감 + stock 감소 (재고 부족 시 거부)
```

---

## 6. 검증 결과

| 항목 | 결과 |
|------|------|
| Next.js 컴파일 | ✅ Compiled successfully |
| TypeScript (신규 파일) | ✅ 에러 없음 |
| 기존 코드 영향 | ✅ 없음 (기존 TS 에러 8개는 이전부터 존재) |
| 비차단 처리 | ✅ 재고 실패해도 문서 상태 변경 성공 보장 |

---

## 7. 사용 시나리오

### 시나리오 1: 자동 매핑
1. `/products/mapping` 페이지 접속
2. "자동 매핑" 버튼 클릭 → 미리보기 모달
3. Tier 1(정확), Tier 2(유사) 매칭 결과 확인
4. "자동 연결 실행" 클릭 → 일괄 연결

### 시나리오 2: 발주서 → 입고
1. 발주서 품목에 제품이 연결되어 있는 상태
2. 발주서 상태를 "완료"로 변경
3. 자동으로:
   - inventory_task (inbound) 생성
   - 각 품목별 LOT 생성
   - 제품 재고 증가
   - 모든 거래 내역 기록

### 시나리오 3: 견적서 → 출고
1. 견적서 품목에 제품이 연결되어 있는 상태
2. 견적서 상태를 "완료"로 변경
3. 자동으로:
   - inventory_task (outbound) 생성
   - FIFO로 LOT 차감
   - 제품 재고 감소
   - 재고 부족 시 경고 (차단 아님)

### 시나리오 4: 수동 조정
1. `POST /api/inventory/adjust` 호출
2. 증가: 새 LOT + stock 증가
3. 감소: FIFO 차감 + stock 감소

---

## 8. 주의사항

1. **자동 매핑은 dry_run 먼저**: 실행 전 반드시 미리보기로 확인
2. **제품 연결 필수**: product_id가 없는 document_items는 재고 처리 생략됨
3. **비차단 설계**: 재고 처리 실패해도 문서 상태 변경은 롤백되지 않음
4. **재고 부족 시 출고**: 경고만 표시, 가능한 수량만큼만 차감 (차단하지 않음)
5. **LOT 번호**: Supabase RPC `generate_lot_number` 사용 (기존 함수 활용)
