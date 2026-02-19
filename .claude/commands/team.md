# CRM System Review Team $ARGUMENTS

## Instructions
You are a team leader that spawns a specialized team to review and analyze the WooyangCRM system. This CRM handles:
- 회사/거래처 관리 (Companies, Contacts)
- 상담 및 영업 관리 (Consultations)
- 견적/주문 문서 관리 (Documents)
- 재고 및 로트 관리 (Inventory, Lots)
- 해외 수출입 관리 (Overseas Orders, Customs)
- 결재 시스템 (Approvals)
- 업무 지시 (Work Orders)
- R&D 과제 관리 (RnDs)
- 사내 게시판/메신저 (Posts, Chat)

## Step 1: Parse Arguments
Parse `$ARGUMENTS` to extract:
- **Agent count (N)**: First token if number, default to 5
- **Focus area**: Specific area to review (optional)

Clamp N to [2, 10].

Examples:
- `전체 리뷰해줘` → N=5, full review
- `UI/UX 집중 분석` → N=5, focus on UI/UX
- `7 데이터 흐름 분석` → N=7, focus on data flow
- `재고-문서 연결 점검` → N=5, focus on inventory-document integration

## Step 2: Assign Review Roles

### Default 5-Agent Configuration (Full Review)

| Agent | Role | Focus Area |
|-------|------|------------|
| `ui-ux-reviewer` | UI/UX 분석 | 사용성, 일관성, 반응형, 접근성 |
| `data-architect` | 데이터 구조 분석 | 스키마 설계, 관계 무결성, 정규화 |
| `security-auditor` | 보안 점검 | 인증/인가, 데이터 보호, RLS 정책 |
| `feature-analyst` | 기능 완성도 분석 | 누락 기능, 연동 문제, 비즈니스 로직 |
| `integration-reviewer` | 통합 점검 | 모듈 간 연결, 데이터 흐름, API 일관성 |

### Agent Responsibilities

#### ui-ux-reviewer
- 화면 레이아웃 일관성
- 네비게이션 구조
- 폼 입력 UX
- 에러 메시지/피드백
- 모바일 반응형
- 로딩 상태 처리
- 테이블/리스트 UI 패턴

#### data-architect
- 테이블 관계 분석
- FK 제약 조건 검토
- 인덱스 최적화 필요성
- 데이터 정규화 수준
- 중복 데이터 패턴
- 히스토리/로그 테이블 설계
- JSON 필드 사용 적절성

#### security-auditor
- Supabase RLS 정책 검토
- 사용자 권한 체계 (roles, role_permissions)
- API 엔드포인트 보호
- 민감 데이터 노출 여부
- 세션 관리 (user_sessions)
- 로그인/인증 흐름
- 파일 업로드 보안

#### feature-analyst
핵심 검토 영역:
- **문서-재고 연결**: documents ↔ inventory_lots/inventory_transactions 연동
- **해외 수출입**: overseas_orders, customs_costs, customs_clearances 완성도
- **결재 시스템**: approval_requests, approval_lines 워크플로우
- **상담-문서 흐름**: consultations → documents → inventory 연계
- **가격 관리**: product_price_history, company_product_aliases 활용도
- **정산 처리**: import_settlements 프로세스

#### integration-reviewer
- 모듈 간 데이터 흐름
- consultations → documents → inventory_tasks 연계
- overseas_orders → customs_costs → import_settlements 연계
- products → inventory_lots → lot_transactions 연계
- approval_requests → related_document/consultation 연계
- 알림 시스템 (notifications) 통합

## Step 3: Execute Workflow

### 3.1 Create Team
```
TeamCreate with team_name: "crm-review-{timestamp}"
```

### 3.2 Create Tasks
Each agent gets a specific task with:
- Clear scope and deliverables
- Access to codebase and schema
- Checklist of items to review

### 3.3 Spawn Agents
Spawn all agents with:
- `subagent_type: "Explore"` for read-only analysis
- Full project context
- Database schema reference
- Instruction to report findings to team-lead

### 3.4 Agent Prompt Template
Each agent must receive:
```
You are {role_name} reviewing WooyangCRM.

Project: /Users/erurang/Desktop/coding/wooyangcrm_prod
Stack: Next.js + Supabase (Vercel deployed)
Schema: [Include relevant tables]

Your focus: {specific_focus_area}

Review checklist:
{role_specific_checklist}

Report format:
1. 현재 상태 요약
2. 발견된 문제점 (심각도 표시: 🔴 Critical / 🟡 Warning / 🟢 Suggestion)
3. 개선 제안 (우선순위 포함)
4. 구체적인 코드/스키마 변경 제안

Send findings to team-lead when complete.
Use TaskUpdate(taskId, status: "completed") when done.
```

### 3.5 Collect and Synthesize

After all agents complete:
1. Gather all findings
2. Deduplicate overlapping issues
3. Prioritize by impact
4. Create actionable roadmap

## Output Format

```
## 🔍 WooyangCRM 시스템 리뷰 리포트

**리뷰 일시**: {timestamp}
**참여 에이전트**: {agent_count}명
**리뷰 범위**: {scope}

---

### 📊 Executive Summary
{핵심 발견사항 3줄 요약}

---

### 🔴 Critical Issues (즉시 수정 필요)
{심각한 문제들}

### 🟡 Warnings (개선 권장)
{주의가 필요한 부분들}

### 🟢 Suggestions (고려 사항)
{있으면 좋은 개선점들}

---

### 📁 영역별 상세 분석

#### UI/UX
{findings}

#### 데이터 구조
{findings}

#### 보안
{findings}

#### 기능 완성도
{findings}

#### 시스템 통합
{findings}

---

### 🗺️ 개선 로드맵

**Phase 1 (즉시)**: {critical fixes}
**Phase 2 (1-2주)**: {important improvements}
**Phase 3 (1개월)**: {nice-to-have features}

---

### 📋 Action Items
| 우선순위 | 항목 | 담당 영역 | 예상 공수 |
|---------|------|----------|----------|
| P0 | ... | ... | ... |
| P1 | ... | ... | ... |
| P2 | ... | ... | ... |
```

## Cleanup
After report delivery:
- TeamDelete to clean up resources
- Save report to `/reports/crm-review-{date}.md` if requested
