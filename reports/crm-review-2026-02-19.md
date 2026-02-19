# WooyangCRM 시스템 리뷰 리포트

**리뷰 일시**: 2026-02-19
**참여 에이전트**: 5명 (UI/UX Reviewer, Data Architect, Security Auditor, Feature Analyst, Integration Reviewer)
**리뷰 범위**: 전체 시스템
**프로젝트 스택**: Next.js + Supabase (Vercel deployed)

---

## 📊 Executive Summary

WooyangCRM은 Next.js + Supabase 기반의 **80+ 테이블**, **10+ 모듈**을 관리하는 대규모 기업용 CRM입니다. 기본 아키텍처와 레이아웃 구조는 견고하나, **보안**, **데이터 정합성**, **모듈 간 통합**에서 심각한 문제가 발견되었습니다.

1. **보안 Critical**: 160+개 API 엔드포인트에 인증 미적용, RLS 정책 부재
2. **데이터 Critical**: 재고 LOT ↔ 상품 재고 동기화 미구현, FK 제약 불일치
3. **통합 Critical**: 문서 완료 → 재고작업 자동 생성 미구현, 알림 시스템 분산화

---

## 🔴 Critical Issues (즉시 수정 필요)

| # | 문제 | 발견 영역 | 영향 |
|---|------|----------|------|
| 1 | **160+개 API 엔드포인트 인증 미적용** - `/api/users`, `/api/admin/*` 등 누구나 접근 가능 | Security | 전체 직원 정보, 세션, 감사 로그 노출 |
| 2 | **Supabase RLS 정책 완전 부재** - DB 수준 접근 제어 전무 | Security | 클라이언트에서 모든 행 접근 가능 |
| 3 | **JWT 기본 SECRET 사용** - `"default-secret-key"` 하드코딩 | Security | 토큰 위조, 계정 탈취 가능 |
| 4 | **Admin API 보호 부재** - 세션 조회/종료, 로그 삭제 무인증 | Security | 권한 상승 공격 |
| 5 | **재고 LOT ↔ products.current_stock 동기화 부재** - 트리거/트랜잭션 없음 | Data / Integration | 재고 불일치, 과출고 가능 |
| 6 | **FK 제약 조건 불일치** - import_settlement_items 등 고아 레코드 위험 | Data | 데이터 무결성 위반 |
| 7 | **문서 완료 → 재고작업 자동 생성 미구현** | Integration / Feature | 입출고 누락, 수동 작업 증가 |
| 8 | **R&D 대시보드 수치 하드코딩 (0)** | Feature | 핵심 지표 미표시 |
| 9 | **Document 테이블 JSONB content에 중복 데이터** | Data | 쿼리 성능 저하, 데이터 불일치 |
| 10 | **페이지 컴포넌트 비대** - inventory/inbound 1,878줄 단일 파일 | UI/UX | 유지보수 어려움, 로딩 성능 저하 |

---

## 🟡 Warnings (개선 권장)

| # | 문제 | 발견 영역 |
|---|------|----------|
| 1 | 알림 생성 함수 이중화 (중앙 vs 로컬) - 일관성 부재 | Integration |
| 2 | 접근성(a11y) 미흡 - aria-label, htmlFor 누락 | UI/UX |
| 3 | CSRF 방지 미설정 - 상태 변경 API 보호 없음 | Security |
| 4 | Rate Limiting 미구현 - DoS/대량 추출 감지 불가 | Security |
| 5 | 결재 승인선 순차 처리 미구현 - 동시성 제어 부재 | Feature / Data |
| 6 | API 로그 복합 인덱스 부재 - 성능 저하 | Data |
| 7 | Tailwind 색상 시스템 불일치 - focus ring, 버튼 색상 혼용 | UI/UX |
| 8 | 해외상담 trade_status 수동 업데이트 의존 | Integration |
| 9 | 문서 API에 가격 추적 로직 미적용 (테스트 페이지에만 존재) | Feature |
| 10 | 파일 업로드 - 클라이언트 MIME만 검증, 실제 내용 미검증 | Security |
| 11 | 비정규화 필드 (consultation.user_name 등) 동기화 부재 | Data |
| 12 | 로딩 상태 패턴 불일치 (Suspense/Skeleton vs MUI CircularProgress 혼용) | UI/UX |

---

## 🟢 Suggestions (고려 사항)

| # | 제안 | 영역 |
|---|------|------|
| 1 | 통합 이벤트 시스템 도입 (이벤트 기반 아키텍처) | Integration |
| 2 | Tailwind Design System 강화 - 브랜드 색상, z-index 체계 | UI/UX |
| 3 | React Hook Form + Zod 폼 검증 라이브러리 도입 | UI/UX |
| 4 | Chat 시스템 ↔ 업무 모듈 연결 (문서/상담 관련 대화방) | Integration |
| 5 | Supabase Realtime 구독 추가 (재고, 결재 상태 실시간 반영) | Integration |
| 6 | API 로그 테이블 월별 파티셔닝 + 보존 정책 | Data |
| 7 | 작업지시 → 생산기록 자동 연결 | Feature |
| 8 | 정산 프로세스 워크플로우 (pending → approved → paid → closed) | Feature |
| 9 | 2FA(이중 인증) 관리자 필수 적용 | Security |

---

## 📁 영역별 상세 분석

### 1. UI/UX

#### 현재 상태

**강점:**
- 일관된 레이아웃 구조 (Layout, Sidebar, TopBar 통합)
- 포괄적인 공통 UI 컴포넌트 라이브러리 (FormField, Toast, ErrorState, EmptyState, Modal)
- 반응형 디자인 패턴 활용 (md:hidden, sm:block 등)
- 로딩 상태 처리 (Suspense, Skeleton components)
- 에러 처리 시스템 (ErrorState, ErrorBoundary)
- 모달/다이얼로그 일관성 (FormModal, DeleteConfirmModal)
- Framer Motion 애니메이션

**약점:**
- inventory/inbound/page.tsx: 1,878줄 단일 파일 (코드 분할 부재)
- UI 색상 일관성 부재 (emerald, blue, orange, red 등 혼용)
- Form Validation 시스템 미흡 (에러 메시지 위치 불일치)
- 모달/오버레이 모두 z-50 사용 (충돌 가능성)

#### 발견된 문제점

**🔴 Critical:**
- 페이지 컴포넌트 크기가 매우 큼 (1,878줄 단일 파일)
- UI 색상 일관성 부재 (focus ring: blue-500, emerald-500, slate-400, red-500 혼용)
- Form Validation 시스템 미흡
- 모달 z-index 충돌 가능성

**🟡 Warning:**
- 접근성(Accessibility) 미흡 (aria-label, role 속성 거의 없음)
- 반응형 디자인 불완전 (일부 페이지만 모바일 카드 레이아웃)
- 모바일 사이드바 vs 모바일 메뉴 이중화
- Tailwind Config에 커스텀 색상 팔레트 미정의
- 로딩 상태 패턴 불일치 (Suspense/Skeleton vs MUI CircularProgress)

**🟢 Suggestion:**
- 모달 Z-Index 시스템 구축 (z-40 dropdown, z-50 modal, z-60 toast)
- Tailwind Design System 강화 (primary, success, warning, error 팔레트)
- 폼 검증 라이브러리 도입 (React Hook Form + Zod/Yup)

#### 구체적 개선 제안

**1. Tailwind Config 통일 (우선순위 1)**
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#eab308',
          600: '#ca8a04',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
    },
  },
};
```

**2. Z-Index 시스템 (우선순위 2)**
```typescript
// lib/z-index.ts
export const zIndex = {
  dropdown: 40,
  sticky: 45,
  modal: 50,
  notification: 60,
  tooltip: 70,
} as const;
```

**3. 거대 페이지 컴포넌트 분할 (우선순위 2)**
- `inventory/inbound/page.tsx` → 모달, 테이블, 필터 등 별도 컴포넌트로 분리
- 목표: 페이지 컴포넌트 400줄 이내

---

### 2. 데이터 구조

#### 현재 상태

**핵심 테이블 구조:**

```
[CRM Core]
├─ companies (거래처)
├─ contacts (담당자)
├─ consultations (상담)
├─ documents (문서: 견적서, 발주서)
├─ document_items (문서 라인 항목)
└─ contacts_consultations / contacts_documents (N:N 관계)

[Inventory & Production]
├─ products (제품 마스터)
├─ inventory_lots (LOT 기반 재고)
├─ lot_transactions (LOT 거래 기록)
├─ lot_splits (LOT 분할 기록)
├─ inventory_tasks (입/출고 작업)
├─ product_materials (BOM)
├─ product_price_history (단가 이력)
├─ company_product_aliases (외부/내부 코드 매핑)
├─ production_records (생산 기록)
└─ production_consumptions (생산 소비 기록)

[Overseas Trade]
├─ overseas_orders (해외 발주)
├─ customs_costs (통관 비용)
├─ import_settlements (입고정산 마스터)
├─ import_settlement_items (정산 항목)
└─ shipping_tracking (배송 추적)

[Organization & Users]
├─ users / teams / departments / roles / role_permissions
└─ user_sessions / login_logs

[Approval System]
├─ approval_requests / approval_lines / approval_categories
├─ approval_rules / approval_templates
└─ approval_files / approval_history

[Communication]
├─ chat_rooms / chat_messages / chat_participants / chat_files
├─ posts / post_comments / post_files
└─ notifications

[R&D / Work Orders / Logging]
├─ rnds / rnd_organizations / rnd_budgets / rnd_expenditures
├─ work_orders / work_order_assignees / work_order_logs
└─ api_logs / user_activity_logs / performance_logs
```

#### 발견된 문제점

**🔴 Critical:**

1. **FK 제약 조건 불일치 및 고아 레코드 위험**
   - `import_settlement_items`에서 `customs_cost_id`와 `consultation_id` 양쪽 모두 NULL 가능
   - 해결: CHECK 제약으로 XOR 조건 추가

2. **JSONB 필드의 과도한 사용과 정규화 부족**
   - `documents.content`에 company_name, notes, total_amount가 컬럼과 중복
   - 쿼리 성능 저하, 데이터 무결성 검증 불가능

3. **재고 관리 테이블 간 동기화 메커니즘 부재**
   - `products.current_stock` (비정규화 캐시)과 `inventory_lots` 수량 불일치 가능
   - Single Source of Truth 미정의

**🟡 Warning:**

4. **상담(Consultations) 비정규화 설계**
   - `user_name`, `contact_name`이 별도 저장되어 이름 변경 시 동기화 안 됨

5. **API 로그 인덱싱 부족**
   - 복합 인덱스 부재 (예: `(user_id, created_at)`)

6. **결재 시스템 동시성 제어 부재**
   - `current_line_order` 동시 접근 시 race condition 가능

7. **삭제 정책 불일치**
   - SET NULL, CASCADE 혼용으로 데이터 손실 또는 orphaned records 발생 가능

#### 구체적 스키마 변경 제안

**1. FK 제약 + CHECK 제약 추가**
```sql
ALTER TABLE import_settlement_items
ADD CONSTRAINT check_settlement_item_source
  CHECK (
    (customs_cost_id IS NOT NULL AND consultation_id IS NULL) OR
    (customs_cost_id IS NULL AND consultation_id IS NOT NULL)
  );
```

**2. 재고 동기화 트리거**
```sql
CREATE OR REPLACE FUNCTION sync_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET current_stock = COALESCE((
    SELECT SUM(current_quantity)
    FROM inventory_lots
    WHERE product_id = NEW.product_id
      AND status IN ('available', 'reserved')
  ), 0),
  updated_at = NOW()
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sync_product_stock
AFTER INSERT OR UPDATE OR DELETE ON inventory_lots
FOR EACH ROW
EXECUTE FUNCTION sync_product_stock();
```

**3. 결재 동시성 제어 (낙관적 잠금)**
```sql
ALTER TABLE approval_requests
ADD COLUMN version INTEGER DEFAULT 1;

ALTER TABLE approval_requests
ADD CONSTRAINT check_version_positive CHECK (version > 0);
```

**4. 복합 인덱스 추가**
```sql
CREATE INDEX idx_api_logs_user_created
  ON api_logs(user_id, created_at DESC NULLS LAST);

CREATE INDEX idx_api_logs_endpoint_status
  ON api_logs(endpoint, status_code, created_at DESC)
  WHERE status_code >= 400;

CREATE INDEX idx_contacts_consultations_consultation
  ON contacts_consultations(consultation_id, contact_id);

CREATE INDEX idx_contacts_documents_document
  ON contacts_documents(document_id, contact_id);
```

**5. 데이터 정합성 검증 쿼리**
```sql
-- 고아 레코드 확인
SELECT * FROM import_settlement_items
WHERE customs_cost_id IS NULL AND consultation_id IS NULL;

-- 재고 불일치 확인
SELECT p.id, p.internal_name, p.current_stock,
  COALESCE(SUM(il.current_quantity), 0) as calculated_stock
FROM products p
LEFT JOIN inventory_lots il ON p.id = il.product_id
GROUP BY p.id, p.internal_name, p.current_stock
HAVING p.current_stock != COALESCE(SUM(il.current_quantity), 0);

-- Document content 중복 데이터 확인
SELECT id,
  content->'company_name' as content_company_name,
  company_name as column_company_name
FROM documents
WHERE content->'company_name' IS NOT NULL
  AND company_name IS NOT NULL
  AND (content->>'company_name') != company_name;
```

---

### 3. 보안

#### 현재 상태

**적용된 보안 기능:**
- Supabase Auth + JWT 토큰 기반 인증
- 역할 기반 권한 관리 (RBAC) 테이블 구조
- 미들웨어를 통한 세션 관리
- API 로깅 및 활동 추적
- 파일 업로드 시 MIME 타입 검증
- XSS 방지를 위한 DOMPurify 사용 (부분적)

#### 발견된 문제점

**🔴 Critical:**

1. **인증 없는 공개 API 엔드포인트 (160+개)**
```typescript
// 예: /api/users/route.ts - 인증 체크 없음
export async function GET() {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, position, level, works_email");
  return NextResponse.json(data || [], { status: 200 });
}
```
- 직원 정보, 부서, 세션, 권한, API 로그 등 민감 데이터 노출

2. **RLS (Row Level Security) 미설정**
- `api_logs`, `user_activity_logs`, `user_sessions` 등 RLS 정책 전무

3. **환경 변수 보안 미흡**
```typescript
const SECRET_KEY = process.env.JWT_SECRET || "default-secret-key"; // 하드코딩된 기본값
```

4. **Admin API에 인증 검증 부재**
- `/api/admin/sessions` - 모든 사용자 세션 조회/종료 가능 (무인증)

5. **SQL Injection 가능성**
```typescript
// 검색어를 직접 쿼리에 포함
if (search) {
  query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
}
// 정렬 파라미터 직접 사용
const sortBy = searchParams.get("sort_by") || "created_at";
query = query.order(sortBy, { ascending: order === "asc" });
```

6. **JWT 기본값 및 약한 검증**
- IP 변경 감지 선언 후 미사용 (`IP_CHANGE_THRESHOLD = 3`)

**🟡 Warning:**
- CSRF 방지 미설정
- Rate Limiting 미구현
- 파일 업로드 MIME 타입만 검증 (실제 내용 미검증)
- 민감한 개인정보 로깅 (이메일/IP 평문)
- 세션 타임아웃 12시간 (너무 길음)

#### 구체적 개선 제안

**1. API 인증 미들웨어 (최우선)**
```typescript
// src/lib/auth.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function requireAuth(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "인증이 필요합니다" },
      { status: 401 }
    );
  }
  return user;
}

export async function requireAdmin(req: NextRequest) {
  const user = await requireAuth(req);
  if (user instanceof NextResponse) return user;

  const supabase = await createSupabaseServer();
  const { data: userData } = await supabase
    .from("users")
    .select("role_id, roles(role_name)")
    .eq("id", user.id)
    .single();

  if (userData?.roles?.role_name !== "admin") {
    return NextResponse.json(
      { error: "관리자 권한이 필요합니다" },
      { status: 403 }
    );
  }
  return user;
}
```

**2. RLS 정책 추가**
```sql
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_logs_admin_only" ON api_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.role_name = 'admin'
    )
  );

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_sessions_own_or_admin" ON user_sessions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.role_name = 'admin'
    )
  );
```

**3. 환경 변수 검증**
```typescript
// src/lib/config.ts
export function validateEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'JWT_SECRET',
    'VAPID_PRIVATE_KEY',
    'CRON_SECRET',
  ];

  const missing = requiredVars.filter(
    (key) => !process.env[key] || process.env[key]?.includes('default')
  );

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.JWT_SECRET === 'default-secret-key') {
    throw new Error('JWT_SECRET must not use default value');
  }
}
```

**4. Rate Limiting**
```typescript
// src/lib/rateLimit.ts
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const data = requestCounts.get(identifier);

  if (!data || now > data.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (data.count < maxRequests) {
    data.count++;
    return true;
  }
  return false;
}
```

**5. 입력값 검증**
```typescript
// src/lib/validation.ts
export function validateSearchInput(input: string): string {
  if (!input || typeof input !== 'string') throw new Error('Invalid search input');
  if (input.length > 255) throw new Error('Search input too long');
  return input.trim();
}

export function validateSortBy(field: string, allowedFields: string[]): string {
  if (!allowedFields.includes(field)) throw new Error('Invalid sort field');
  return field;
}
```

---

### 4. 기능 완성도

#### 모듈별 완성도

| 모듈 | 완성도 | 상태 |
|------|--------|------|
| **상담 관리** | 85% | 기본 CRUD 완성, 상담-문서 연결 구현 |
| **문서 관리** (견적/발주/송장) | 90% | 완전 구현, 재고 연동 기본 구현 |
| **재고 관리** | 75% | LOT 관리/입출고 작업 구현, 자동발주 제안 미완성 |
| **해외 수출입** | 70% | 기본 기능 구현, 통관비용/정산 연동 미약 |
| **결재 시스템** | 80% | 기본 워크플로우 구현, 승인선 관리 기본 |
| **R&D 과제 관리** | 65% | 예산/성과물/집행현황 기본 구현, 대시보드 수치 미연동 |
| **생산/작업지시** | 70% | 작업지시 기본 구현, 생산기록 미완성 |
| **제품 관리** | 75% | 기본 CRUD, 가격이력/별칭 추적 구현 |
| **게시판/메신저** | 85% | 완전 구현, 참조 기능 추가됨 |
| **정산 처리** | 60% | 입고정산 기본 구현, 프로세스 미완성 |

#### 발견된 문제점

**🔴 Critical:**

1. **R&D 대시보드 수치 미연동**
   - 파일: `src/app/manage/(rnd)/rnds/dashboard/page.tsx` (line 112-115)
   - `total_expenditure`, `outcome_count`, `researcher_count` 모두 0 하드코딩

2. **자동발주 권장 기능 미완성**
   - 파일: `src/app/api/inventory/auto-order-suggestions/route.ts` (line 161)
   - `preferredSupplier` 항상 null 반환 (TODO 주석)

3. **해외-재고 워크플로우 단절**
   - overseas_consultations ↔ customs_costs ↔ import_settlements 자동 생성 로직 없음

4. **결재 승인선 자동 진행 미구현**
   - 승인선이 여러 개일 때 순차 진행 로직 부재

**🟡 Warning:**

5. **문서-재고 이력 기록 추적 부분 구현**
   - `product_price_history`, `company_product_aliases` 업데이트 로직이 테스트 페이지에만 존재
   - 메인 문서 API(`/api/documents`)에는 미적용

6. **R&D 예산 집행 권한 관리 미흡**
   - 비목별 한도 체크, 집행 권한 검증 로직 없음

7. **채팅 메시지 자동 스크롤 미구현** (TODO 주석)

8. **통관비용 엑셀 다운로드 미구현** (TODO)

#### 구체적 기능 추가 제안

**1. R&D 대시보드 데이터 연동 API**
```typescript
// /src/app/api/manage/(rnd)/rnds/[id]/dashboard-stats/route.ts
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const { data: expenditures } = await supabase
    .from('rnd_expenditures')
    .select('amount')
    .eq('rnd_id', id)
    .eq('approval_status', 'approved');

  const totalExpenditure = expenditures?.reduce(
    (sum, e) => sum + Number(e.amount), 0
  ) || 0;

  const { count: outcomeCount } = await supabase
    .from('rnd_outcomes')
    .select('id', { count: 'exact' })
    .eq('rnd_id', id);

  const { count: researcherCount } = await supabase
    .from('rnd_researchers')
    .select('id', { count: 'exact' })
    .eq('rnd_id', id)
    .eq('is_active', true);

  return NextResponse.json({
    total_expenditure: totalExpenditure,
    outcome_count: outcomeCount || 0,
    researcher_count: researcherCount || 0,
  });
}
```

**2. 결재 승인선 순차 처리**
```typescript
async function activateNextApprovalLine(
  requestId: string,
  currentLineOrder: number
) {
  const { data: nextLine } = await supabase
    .from('approval_lines')
    .select('*')
    .eq('request_id', requestId)
    .eq('line_order', currentLineOrder + 1)
    .single();

  if (nextLine && nextLine.is_required) {
    await notifyApprovalLine(nextLine);
  }

  const { data: allLines } = await supabase
    .from('approval_lines')
    .select('status')
    .eq('request_id', requestId)
    .eq('is_required', true);

  const allApproved = allLines?.every(l => l.status === 'approved');

  if (allApproved) {
    await supabase
      .from('approval_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);
  }
}
```

**3. 자동 발주 공급업체 추천**
```typescript
async function findPreferredSupplier(productId: string) {
  const { data: recent } = await supabase
    .from('company_product_aliases')
    .select('company_id, companies(name), use_count, last_used_at')
    .eq('product_id', productId)
    .eq('alias_type', 'purchase')
    .order('last_used_at', { ascending: false })
    .limit(1);

  return recent?.[0]?.companies || null;
}
```

#### 연결 상태 맵

```
consultations (상담)
  ├─ documents (문서) ✅ 연결됨
  │   ├─ document_items (품목)
  │   └─ inventory_tasks (재고작업) ⚠️ 부분 구현
  │       └─ inventory_lots (LOT) ✅
  │
  ├─ approvals (결재) ✅ 기본 구현
  │   └─ approval_lines (승인선) ⚠️ 순차 처리 미흡
  │
  └─ overseas_consultations (해외)
      ├─ customs_costs (통관비용) ⚠️ 약한 연결
      │   └─ import_settlements (정산) ❌ 수동 연결
      └─ overseas_orders (수출입) ✅
```

---

### 5. 시스템 통합

#### 핵심 통합 경로

**경로 1: 상담 → 문서 → 재고작업**
```
상담 (consultations)
  └→ 문서 (documents.consultation_id)
        └→ 문서 완료 (status=completed)
              └→ 재고작업 생성 (inventory_tasks) ❌ 자동 생성 미구현
```

**경로 2: 해외상담 → 통관비 → 입고정산**
```
해외상담 (consultations)
  └→ 통관비용 (customs_costs.consultation_id) ✅
        └→ 입고정산 항목 (import_settlement_items) ✅ 기본 구현
```

**경로 3: 재고 LOT → 트랜잭션**
```
products → inventory_lots → lot_transactions
  └→ products.current_stock 동기화 ❌ 트리거 없음
```

**경로 4: 결재 → 관련 문서/상담**
```
approval_requests → related_document_id / related_consultation_id
  └→ 실제 사용 코드 미발견 ⚠️
```

#### 발견된 문제점

**🔴 Critical:**

1. **문서 → 재고작업 자동 생성 미구현**
   - 문서 완료 시 `inventory_tasks` 자동 생성 안 됨
   - 사용자 수동으로 "재고작업 생성" 필요

2. **재고 LOT 정합성 관리 전략 부재**
   - 출고 시 LOT 할당 규칙 미정의 (FIFO/LIFO/수동)
   - 과출고 방지 로직 부재

3. **해외상담 trade_status 동기화 불완전**
   - 수동 업데이트 의존, 상태 불일치 발생 가능

**🟡 Warning:**

4. **알림 발송 분산화**
   - 중앙화 함수 (`/lib/notifications.ts`)와 로컬 함수 (각 API 라우트) 이중 존재
   - PWA 푸시 알림 일관성 부재

5. **재고작업 담당자 배정 알림 미발송**

6. **Import Settlement Items 다중 참조 문제**
   - customs_cost_id와 consultation_id 동시 참조 가능 (모호함)

7. **Approval Related 필드 미사용**
   - `related_document_id`, `related_consultation_id` 타입만 정의, 조회/표시 로직 불명확

#### 구체적 개선 제안

**1. 문서 → 재고작업 자동 생성**
```typescript
// /src/app/api/documents/status/route.ts 에 추가
if (newStatus === "completed") {
  const { data: inventoryTask } = await supabase
    .from("inventory_tasks")
    .insert({
      document_id: documentId,
      document_number: doc.document_number,
      document_type: doc.type,
      task_type: doc.type === "order" ? "inbound" : "outbound",
      company_id: doc.company_id,
      expected_date: doc.delivery_date,
      status: "pending",
      assigned_by: user_id,
    })
    .select()
    .single();

  if (!taskError) {
    await createNotification({
      userId: doc.user_id,
      type: doc.type === "order" ? "order_completed" : "estimate_completed",
      title: `${doc.document_number} 완료됨`,
      message: "재고작업이 생성되었습니다.",
      relatedId: inventoryTask?.id,
      relatedType: "inventory_task"
    });
  }
}
```

**2. 알림 함수 중앙화**
```typescript
// 모든 로컬 createNotification 함수 제거
// /src/lib/notifications.ts 만 사용하도록 통일

// 추가 알림 함수:
export async function notifyInventoryAssignment({
  taskId, assignedToUserId, taskType, documentNumber
}) {
  return createNotification({
    userId: assignedToUserId,
    type: taskType === "inbound" ? "inbound_assignment" : "outbound_assignment",
    title: `${documentNumber} 재고작업 배정됨`,
    message: `${taskType === 'inbound' ? '입고' : '출고'} 작업을 배정받았습니다.`,
    relatedId: taskId,
    relatedType: "inventory_task",
  });
}
```

**3. 통합 이벤트 시스템 (장기)**
```typescript
// src/lib/events.ts
type EventType =
  | "document.completed"
  | "inventory_task.created"
  | "inventory_task.assigned"
  | "approval.approved"
  | "trade_status.updated";

export async function publishEvent(event: {
  type: EventType;
  timestamp: Date;
  actor_id: string;
  data: Record<string, unknown>;
}) {
  // 1. 이벤트 로그 저장
  await supabase.from("event_logs").insert(event);

  // 2. 등록된 핸들러 실행
  const handlers = EVENT_HANDLERS[event.type] || [];
  for (const handler of handlers) {
    await handler(event).catch(console.error);
  }
}
```

---

## 🗺️ 개선 로드맵

### Phase 1 (즉시 - 1주): Critical Security + Data Fixes
- 모든 API 라우트에 `requireAuth()` 적용
- RLS 정책 전체 적용
- JWT SECRET 환경 변수 검증 강화 (기본값 제거)
- FK 제약 조건 + CHECK 제약 추가
- DB 트리거로 재고 동기화 (inventory_lots → products.current_stock)

### Phase 2 (1-2주): Integration + Feature Completion
- 문서 완료 → 재고작업 자동 생성 구현
- R&D 대시보드 실시간 데이터 연동
- 결재 승인선 순차 처리 로직
- 알림 함수 중앙화 (`/lib/notifications.ts`로 통합)
- Rate Limiting, CSRF 토큰 구현
- Document.content 정규화 (중복 필드 제거)

### Phase 3 (2-4주): UX + Architecture
- Tailwind Design System 정의 (색상, z-index, 컴포넌트 규격)
- 거대 페이지 컴포넌트 분할 (inbound 1,878줄 등)
- 해외-정산 자동화
- 복합 인덱스 추가
- 접근성 기본 개선

### Phase 4 (1-2개월): Advanced Features
- 이벤트 기반 아키텍처 도입
- Supabase Realtime 구독
- Chat ↔ 업무 모듈 연결
- 2FA 도입
- 로그 파티셔닝 + 보존 정책
- React Hook Form + Zod 폼 검증

---

## 📋 Action Items

| 우선순위 | 항목 | 담당 영역 | 예상 공수 |
|---------|------|----------|----------|
| **P0** | API 엔드포인트 인증 미들웨어 적용 (160+개) | Security | 2-3일 |
| **P0** | Supabase RLS 정책 전체 적용 | Security | 2-3일 |
| **P0** | JWT 기본 SECRET 제거 + 환경 변수 검증 | Security | 2시간 |
| **P0** | DB 트리거: inventory_lots → products.current_stock 동기화 | Data | 1일 |
| **P0** | FK 제약 + CHECK 제약 추가 (import_settlement_items 등) | Data | 1일 |
| **P1** | 문서 완료 → 재고작업 자동 생성 | Integration | 1-2일 |
| **P1** | R&D 대시보드 데이터 연동 (하드코딩 제거) | Feature | 2-4시간 |
| **P1** | 알림 함수 중앙화 (로컬 함수 제거) | Integration | 1일 |
| **P1** | 결재 승인선 순차 처리 + 동시성 제어 | Feature/Data | 2-3일 |
| **P1** | Rate Limiting + CSRF 토큰 | Security | 1-2일 |
| **P2** | Document.content JSONB 정규화 | Data | 2-3일 |
| **P2** | Tailwind Design System (색상 팔레트, z-index) | UI/UX | 1일 |
| **P2** | 거대 페이지 컴포넌트 분할 | UI/UX | 3-4일 |
| **P2** | 해외-정산 자동화 | Feature | 3-4일 |
| **P2** | 복합 인덱스 추가 (api_logs, activity_logs) | Data | 반일 |
| **P3** | 이벤트 기반 아키텍처 도입 | Integration | 1주 |
| **P3** | 접근성 개선 (aria-*, htmlFor) | UI/UX | 3-4일 |
| **P3** | Form 검증 라이브러리 (React Hook Form + Zod) | UI/UX | 1주 |
| **P3** | Supabase Realtime 구독 | Integration | 3-4일 |
| **P3** | Chat ↔ 업무 모듈 연결 | Integration | 1주 |
| **P3** | 2FA 관리자 필수 적용 | Security | 3-4일 |

---

> **최우선 권고**: P0 보안 이슈를 즉시 해결하세요. 현재 모든 API가 인증 없이 공개되어 있어 프로덕션 환경에서 심각한 데이터 유출 위험이 있습니다.
