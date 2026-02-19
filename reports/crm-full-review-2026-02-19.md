# WooyangCRM 전체 시스템 리뷰 리포트

**리뷰 일시**: 2026-02-19
**참여 에이전트**: 5명 (UI/UX, 프론트엔드 코드품질, 백엔드 API, 기능 완성도, 데이터흐름/통합)
**리뷰 범위**: 전체 프로젝트 (RLS 제외, 프론트/백엔드 집중)
**전체 시스템 완성도**: ~75%

---

## Executive Summary

WooyangCRM은 Next.js 14+ App Router + Supabase 기반의 기업용 CRM 시스템으로, 12개 이상의 주요 모듈을 갖추고 있습니다. 핵심 모듈(회사관리, 상담, 문서)은 프로덕션 수준이며, 보조 모듈(재고, 해외, R&D)은 기능적이나 개선이 필요합니다.

**핵심 발견사항:**
1. 트랜잭션 없는 다단계 DB 작업으로 데이터 무결성 위험
2. 109개 파일에서 `any` 타입 사용 - TypeScript 안전성 저하
3. 문서→재고 자동 연동 누락 - 수동 작업 필요
4. 알림 코드 중복 - 사용자 설정 무시 위험
5. 제품명 정규화/퍼지매칭 미구현 - 재고 관리 핵심 블로커

---

## 🔴 Critical Issues (즉시 수정 필요)

### BACKEND

| # | 이슈 | 파일 | 설명 |
|---|------|------|------|
| B1 | 트랜잭션 없는 다단계 삭제 | `api/approvals/[id]/route.ts` | approval_lines, files, shares, history, settings 순차 삭제 시 중간 실패하면 orphan 레코드 발생 |
| B2 | 결재 생성 트랜잭션 누락 | `api/approvals/route.ts` | request 생성 후 lines 생성 실패 시 rollback 안됨 |
| B3 | 정산 생성 트랜잭션 누락 | `api/import-settlements/route.ts` | settlement 생성 후 items 실패 시 orphan |
| B4 | 상담-담당자 연결 실패 무시 | `api/overseas/consultations/route.ts` | contact link 실패해도 201 반환 |
| B5 | 문서 삭제 시 orphan 발생 | `api/documents/[id]/route.ts` | document_items, inventory_tasks 미정리 |
| B6 | LOT 분할 RPC 결과 검증 부족 | `api/inventory/lots/[id]/split/route.ts` | 빈 배열/null 시 모호한 에러 |
| B7 | API 응답 형식 불일치 | 전체 API | data/items/contacts 등 키 혼재, 에러 형식도 제각각 |

### FRONTEND

| # | 이슈 | 파일 | 설명 |
|---|------|------|------|
| F1 | `any` 타입 109개 파일 | 전체 | 타입 안전성 없음, API 응답 타입 미정의 |
| F2 | 500줄+ 거대 컴포넌트 4개 | shipping(900+), DocPage(800+), customers(700+), OverseasOrderFormModal(600+) | 유지보수/테스트 불가 |
| F3 | Error Boundary 미구현 | 전체 | 모듈별 에러 격리 없음, 하나 터지면 전체 페이지 크래시 |
| F4 | 알림 코드 중복 | `api/consultations/route.ts`, `api/inventory/tasks/[id]/route.ts` | lib/notifications.ts 안쓰고 직접 DB insert → 사용자 알림 설정 무시 |

### UI/UX

| # | 이슈 | 파일 | 설명 |
|---|------|------|------|
| U1 | 버튼 컬러 불일치 | Pagination(teal), FormModal(blue), Sidebar(indigo) | 브랜드 일관성 없음 |
| U2 | 접근성(ARIA) 미비 | 전체 모달, 버튼, 드롭다운 | aria-label 8개뿐, role 속성 없음, 포커스 트랩 없음 |
| U3 | 모달 포커스 관리 없음 | FormModal, DeleteConfirmModal 등 59개 | 키보드 사용자 모달 외부 탭 가능 |

### INTEGRATION

| # | 이슈 | 파일 | 설명 |
|---|------|------|------|
| I1 | 문서→재고 자동 생성 없음 | api/documents | 문서 완료→inventory_task 자동 생성 안됨, 수동 필요 |
| I2 | 제품명 퍼지매칭 없음 | ProductSearchModal, mapping/page | 정확 매칭만 가능, 변형 제품명 감지 불가 |
| I3 | 결재↔문서 연결 없음 | approval_requests 스키마 | related_document_id 컬럼 없음 |

---

## 🟡 Warnings (개선 권장)

### BACKEND

| # | 이슈 | 설명 |
|---|------|------|
| B8 | inventory_tasks PATCH 핸들러 누락 | 작업 상태/배정 수정 API 없음 |
| B9 | lot_transactions POST 누락 | 재고 입출고 기록 API 없음 |
| B10 | 해외주문 정산 완료 워크플로우 없음 | 주문이 영원히 pending 상태 |
| B11 | 가격 이력 값 검증 없음 | unit_price가 숫자인지, 0 이상인지 미확인 |
| B12 | 연락처 중복 검증 없음 | 같은 회사에 같은 이름 중복 생성 가능 |
| B13 | 상담 연락처 link 업데이트 시 silent fail | 레코드 없으면 update가 0행 영향 |
| B14 | 재고작업 client-side 페이지네이션 | 전체 결과 메모리 로드 후 slice |
| B15 | 하드코딩된 페이지네이션 값 | consultationsPerPage=4, limit=15 등 |

### FRONTEND

| # | 이슈 | 설명 |
|---|------|------|
| F5 | 100+ console.log 프로덕션 코드 | FedEx, notifications, file operations |
| F6 | React.memo 미적용 | ChatMessage, DocPage items, 테이블 렌더링 |
| F7 | 에러 응답 data.error 체크 16곳뿐 | 299개 try/catch 중 대부분 silent fail |
| F8 | SWR retry/timeout 미설정 | 실패 시 무한 대기 가능 |
| F9 | Context 부족 | Overseas, Inventory, Document, Chat 글로벌 상태 없음 |
| F10 | 번들 사이즈 | @mui/material + @tiptap(8) + @dnd-kit(4) 동시 사용 |
| F11 | numberToKorean 중복 | lib/ 와 utils/ 양쪽 존재 |

### UI/UX

| # | 이슈 | 설명 |
|---|------|------|
| U4 | 로딩 상태 불일치 | 커스텀 스피너, 텍스트, 스켈레톤 혼재 |
| U5 | 에러 페이지 스타일 불일치 | error.tsx(Tailwind), global-error.tsx(인라인 스타일) |
| U6 | 소형 텍스트 대비 부족 | text-[10px] + text-gray-400 조합 |
| U7 | 폼 검증 스타일 불일치 | FormField vs CompanyBasicInfoForm 에러 패턴 다름 |
| U8 | Pagination teal-600 색상 | 기본 indigo와 안맞음 |
| U9 | 비활성 폼 필드 시각 구분 없음 | disabled 상태 스타일 미정의 |
| U10 | 파일 업로드 피드백 부족 | 드래그 상태, 진행률 미표시 |
| U11 | 탭 키보드 내비게이션 없음 | Arrow 키 미지원, aria-selected 없음 |
| U12 | 긴 작업 중간 피드백 없음 | 5초 이상 작업 시 persistent 로딩 없음 |

### INTEGRATION

| # | 이슈 | 설명 |
|---|------|------|
| I4 | customs_costs.consultation_id nullable | 약한 연결, 정산 정확도 위험 |
| I5 | 자동 정산 생성 없음 | 통관비 기록→정산 초안 자동 생성 없음 |
| I6 | Supabase Realtime 미사용 | 폴링만 사용, 실시간 협업 불가 |
| I7 | 비정규화 데이터 동기화 없음 | product 수정 시 document_items.internal_name 미갱신 |
| I8 | documents.content JSONB ↔ document_items 불일치 | product_id 링크 시 JSONB 미갱신 |
| I9 | products.current_stock ↔ inventory_lots 합계 불일치 가능 | 재고 reconciliation 없음 |
| I10 | 파일 업로드 크기/타입 검증 없음 | 무제한 업로드 가능 |

---

## 🟢 Suggestions (고려 사항)

| # | 이슈 | 설명 |
|---|------|------|
| S1 | 줌 기능 피드백 개선 | 텍스트 크기 증가, 변경 시 토스트 |
| S2 | 검색 디바운스 피드백 | 타이핑 중 로딩 인디케이터 |
| S3 | 활성 필터 뱃지 | 적용된 필터 수 표시 |
| S4 | 사이드바 truncated 텍스트 title 속성 | 잘린 메뉴명 툴팁 |
| S5 | 모달 타이틀 크기 통일 | text-lg md:text-xl 표준화 |
| S6 | 환율 표시 최적화 | 축소 가능하게 또는 USD만 기본 표시 |
| S7 | 날짜 범위 선택기 도입 | react-day-picker 등 |
| S8 | 서비스워커 별도 파일 분리 | layout.tsx 인라인 스크립트 제거 |
| S9 | createFileService.ts 통합 사용 | 모듈별 파일 서비스 중복 제거 |

---

## 모듈별 완성도 요약

| 모듈 | 완성도 | CRUD | 워크플로우 | 핵심 이슈 |
|------|--------|------|-----------|----------|
| Dashboard | 85% | R | 기본 | 데이터 검증 필요 |
| Companies | 90% | CRUD | 기본 | 양호 |
| Consultations | 88% | CRUD | 우수 | 후속 자동화 부족 |
| Documents | 82% | CRUD | 고급 | PDF 품질, 이메일 발송 미구현 |
| Products | 75% | CR-- | 기본 | **마스터 CRUD 페이지 없음** |
| Inventory | 70% | CRU- | 우수 | **PATCH API 없음**, 자동 생성 없음 |
| Overseas | 72% | CRUD | 보통 | 정산 자동화 부족 |
| Approvals | 78% | CRU- | 미완성 | **승인/반려 워크플로우 불완전** |
| Work Orders | 72% | CRU- | 기본 | 파일 첨부 없음 |
| R&D | 72% | CRUD | 기본 | 예산 승인 워크플로우 없음 |
| Board | 80% | CRUD | 기본 | 고급 필터 부족 |
| Chat | 78% | CRU- | N/A | Realtime 미사용 |

---

## 개선 로드맵

### Phase 1: 즉시 (Critical Fixes)

**프론트엔드 팀:**
1. Error Boundary 구현 (모듈별 에러 격리)
2. 거대 컴포넌트 분리 (shipping, DocPage, customers, OverseasOrderFormModal)
3. 알림 코드 중복 제거 → lib/notifications.ts 통합 사용
4. 버튼 컬러 통일 (indigo-600 기준)
5. console.log 정리

**백엔드 팀:**
1. 다단계 DB 작업에 트랜잭션/롤백 적용 (approvals, settlements)
2. 문서 삭제 시 관련 레코드 정리 로직
3. API 응답 형식 표준화 (ListResponse, ErrorResponse 인터페이스)
4. 문서 완료→재고작업 자동 생성 API

### Phase 2: 1-2주 (High Priority)

**프론트엔드 팀:**
1. `any` 타입 → proper interface 변환 (API 응답부터)
2. React.memo 적용 (ChatMessage, 테이블 행)
3. SWR retry/timeout 설정
4. 로딩 상태 패턴 통일
5. 폼 검증 스타일 통일

**백엔드 팀:**
1. inventory_tasks PATCH, lot_transactions POST API 추가
2. 해외주문 정산 완료 워크플로우
3. 가격/연락처 입력 검증 강화
4. 비정규화 데이터 동기화 트리거

### Phase 3: 1개월 (Polish & Automation)

**프론트엔드 팀:**
1. 접근성(ARIA) 대폭 개선
2. 모달 포커스 트랩 구현
3. 제품명 퍼지매칭 (fuse.js)
4. Supabase Realtime 연동 (채팅 우선)
5. 번들 사이즈 최적화

**백엔드 팀:**
1. 결재↔문서 연결 스키마 추가
2. 통관비→정산 자동 초안 생성
3. 파일 업로드 크기/타입 제한
4. 로깅 유틸리티 통합
5. 재고 reconciliation 로직

---

## Action Items 요약

| 우선순위 | 항목 | 담당 | 예상 공수 |
|---------|------|------|----------|
| P0 | 트랜잭션/롤백 적용 (approvals, settlements, documents 삭제) | 백엔드 | 4h |
| P0 | Error Boundary 모듈별 구현 | 프론트 | 3h |
| P0 | 알림 코드 중복 제거 | 백엔드 | 2h |
| P0 | API 응답 형식 표준화 | 백엔드 | 4h |
| P0 | 거대 컴포넌트 분리 (4개) | 프론트 | 8h |
| P1 | 문서→재고작업 자동 생성 | 백엔드 | 3h |
| P1 | `any` 타입 교체 (API 응답 우선) | 프론트 | 8h |
| P1 | 재고 PATCH/POST API 추가 | 백엔드 | 4h |
| P1 | 버튼 컬러 + 로딩 상태 통일 | 프론트 | 3h |
| P1 | console.log 정리 | 프론트 | 2h |
| P2 | 제품명 퍼지매칭 구현 | 프론트 | 3h |
| P2 | Supabase Realtime (채팅) | 프론트+백 | 6h |
| P2 | 접근성(ARIA) 개선 | 프론트 | 6h |
| P2 | 비정규화 동기화 트리거 | 백엔드 | 4h |
| P2 | 결재↔문서 연결 | 백엔드 | 4h |

---

*이 리포트는 5개 전문 에이전트의 분석을 종합한 결과입니다.*
