/**
 * 국가과제 R&D 관리 시스템 타입 정의
 * 기업부설연구소 국가과제 R&D 관리에 최적화
 */

// =====================================================
// 과제 상태
// =====================================================
export type RndProjectStatus =
  | "planning"      // 기획중
  | "application"   // 신청중
  | "evaluation"    // 평가중
  | "selected"      // 선정
  | "contracting"   // 협약중
  | "ongoing"       // 수행중
  | "final_report"  // 최종보고
  | "completed"     // 종료
  | "settlement"    // 정산중
  | "closed";       // 정산완료

export const RND_STATUS_LABELS: Record<RndProjectStatus, string> = {
  planning: "기획중",
  application: "신청중",
  evaluation: "평가중",
  selected: "선정",
  contracting: "협약중",
  ongoing: "수행중",
  final_report: "최종보고",
  completed: "종료",
  settlement: "정산중",
  closed: "정산완료",
};

export const RND_STATUS_COLORS: Record<RndProjectStatus, { bg: string; text: string }> = {
  planning: { bg: "bg-gray-100", text: "text-gray-700" },
  application: { bg: "bg-blue-100", text: "text-blue-700" },
  evaluation: { bg: "bg-yellow-100", text: "text-yellow-700" },
  selected: { bg: "bg-green-100", text: "text-green-700" },
  contracting: { bg: "bg-indigo-100", text: "text-indigo-700" },
  ongoing: { bg: "bg-emerald-100", text: "text-emerald-700" },
  final_report: { bg: "bg-orange-100", text: "text-orange-700" },
  completed: { bg: "bg-purple-100", text: "text-purple-700" },
  settlement: { bg: "bg-pink-100", text: "text-pink-700" },
  closed: { bg: "bg-slate-100", text: "text-slate-700" },
};

// =====================================================
// 과제 유형
// =====================================================
export type RndProjectType =
  | "tech_dev"        // 기술개발
  | "hr_training"     // 인력양성
  | "facility"        // 시설장비
  | "commercialize"   // 사업화
  | "basic_research"  // 기초연구
  | "applied_research" // 응용연구
  | "other";          // 기타

export const RND_PROJECT_TYPE_LABELS: Record<RndProjectType, string> = {
  tech_dev: "기술개발",
  hr_training: "인력양성",
  facility: "시설장비",
  commercialize: "사업화",
  basic_research: "기초연구",
  applied_research: "응용연구",
  other: "기타",
};

// =====================================================
// 예산 비목
// =====================================================
export type RndBudgetCategory =
  // 직접비
  | "personnel"           // 인건비
  | "student_personnel"   // 학생인건비
  | "equipment"           // 연구장비비
  | "materials"           // 재료비
  | "outsourcing"         // 위탁연구비
  | "international"       // 국제공동연구비
  | "travel"              // 여비
  | "meeting"             // 회의비
  | "advisory"            // 자문비
  | "other_direct"        // 기타 직접비
  // 간접비
  | "incentive"           // 연구수당
  | "overhead";           // 간접비

export const RND_BUDGET_CATEGORY_LABELS: Record<RndBudgetCategory, string> = {
  personnel: "인건비",
  student_personnel: "학생인건비",
  equipment: "연구장비비",
  materials: "재료비",
  outsourcing: "위탁연구비",
  international: "국제공동연구비",
  travel: "여비",
  meeting: "회의비",
  advisory: "자문비",
  other_direct: "기타 직접비",
  incentive: "연구수당",
  overhead: "간접비",
};

export const RND_BUDGET_CATEGORIES_DIRECT: RndBudgetCategory[] = [
  "personnel",
  "student_personnel",
  "equipment",
  "materials",
  "outsourcing",
  "international",
  "travel",
  "meeting",
  "advisory",
  "other_direct",
];

export const RND_BUDGET_CATEGORIES_INDIRECT: RndBudgetCategory[] = [
  "incentive",
  "overhead",
];

// =====================================================
// 성과물 유형
// =====================================================
export type RndOutcomeType =
  | "patent_domestic"      // 국내특허
  | "patent_international" // 해외특허
  | "paper_sci"            // SCI 논문
  | "paper_domestic"       // 국내논문
  | "tech_transfer"        // 기술이전
  | "prototype"            // 시제품
  | "certification"        // 인증
  | "sales"                // 매출
  | "employment"           // 고용창출
  | "other";               // 기타

export const RND_OUTCOME_TYPE_LABELS: Record<RndOutcomeType, string> = {
  patent_domestic: "국내특허",
  patent_international: "해외특허",
  paper_sci: "SCI 논문",
  paper_domestic: "국내논문",
  tech_transfer: "기술이전",
  prototype: "시제품",
  certification: "인증",
  sales: "매출",
  employment: "고용창출",
  other: "기타",
};

// =====================================================
// 보고서 유형
// =====================================================
export type RndReportType =
  | "proposal"    // 사업계획서
  | "interim"     // 중간보고서
  | "annual"      // 연차보고서
  | "final"       // 최종보고서
  | "settlement"; // 정산보고서

export const RND_REPORT_TYPE_LABELS: Record<RndReportType, string> = {
  proposal: "사업계획서",
  interim: "중간보고서",
  annual: "연차보고서",
  final: "최종보고서",
  settlement: "정산보고서",
};

// =====================================================
// 엔티티 인터페이스
// =====================================================

/** 지원기관 (전문기관) */
export interface RndOrg {
  id: string;
  name: string;
  org_type?: string;
  ministry?: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  website?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  rnds_contacts?: RndOrgContact[];
}

/** 지원기관 담당자 */
export interface RndOrgContact {
  id: string;
  org_id: string;
  name: string;
  department?: string;
  level?: string;
  phone?: string;
  email?: string;
  created_at?: string;
}

/** 참여기관 정보 */
export interface ParticipatingOrg {
  name: string;
  role: "lead" | "participant" | "subcontractor";
  contribution?: number;
}

/** 연차별 계획 */
export interface AnnualPlan {
  year: number;
  goal: string;
  budget: number;
  milestones: string[];
}

/** R&D 과제 */
export interface RndProject {
  id: string;
  name: string;
  project_number?: string;
  project_type?: RndProjectType;
  status: RndProjectStatus;
  program_name?: string;
  announcement_number?: string;

  // 기간
  start_date?: string;
  end_date?: string;
  contract_date?: string;

  // 예산
  gov_contribution?: string | number;
  pri_contribution?: string | number;
  in_kind_contribution?: number;
  total_cost?: string | number;

  // 기관
  org_id?: string;
  rnd_orgs?: RndOrg;
  lead_org_name?: string;
  participating_orgs?: ParticipatingOrg[];

  // 연구책임자
  principal_investigator_id?: string;
  principal_investigator?: {
    id: string;
    name: string;
    position?: string;
  };

  // 기타
  keywords?: string[];
  annual_plans?: AnnualPlan[];
  notes?: string;
  type?: string; // 레거시 호환

  created_at?: string;
  updated_at?: string;
}

/** 예산 항목 */
export interface RndBudget {
  id: string;
  rnd_id: string;
  year: number;
  category: RndBudgetCategory;
  gov_amount: number;
  private_amount: number;
  in_kind_amount: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/** 예산 집행 */
export interface RndExpenditure {
  id: string;
  rnd_id: string;
  budget_id?: string;
  year: number;
  category: RndBudgetCategory;
  expenditure_date: string;
  amount: number;
  description?: string;
  vendor?: string;
  evidence_type?: string;
  evidence_number?: string;
  file_url?: string;
  created_by?: string;
  approved_by?: string;
  approval_status: "pending" | "approved" | "rejected";
  created_at?: string;
  updated_at?: string;
}

/** 참여연구원 */
export interface RndResearcher {
  id: string;
  rnd_id: string;
  user_id?: string;
  name: string;
  role?: "principal" | "co_principal" | "researcher" | "assistant";
  affiliation?: string;
  position?: string;
  specialty?: string;
  participation_rate?: number;
  personnel_cost?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  user?: {
    id: string;
    name: string;
    position?: string;
  };
}

export const RND_RESEARCHER_ROLE_LABELS: Record<string, string> = {
  principal: "연구책임자",
  co_principal: "공동연구책임자",
  researcher: "참여연구원",
  assistant: "연구보조원",
};

/** 성과물 */
export interface RndOutcome {
  id: string;
  rnd_id: string;
  outcome_type: RndOutcomeType;
  title: string;
  description?: string;

  // 특허
  application_number?: string;
  registration_number?: string;
  application_date?: string;
  registration_date?: string;

  // 논문
  journal_name?: string;
  publish_date?: string;
  authors?: string[];
  doi?: string;
  impact_factor?: number;

  // 기술이전
  transferee?: string;
  transfer_amount?: number;
  transfer_date?: string;

  // 매출
  sales_amount?: number;

  // 공통
  file_url?: string;
  evidence_file_url?: string;
  status: "planned" | "in_progress" | "completed";
  target_year?: number;
  achievement_year?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/** 보고서 */
export interface RndReport {
  id: string;
  rnd_id: string;
  report_type: RndReportType;
  title: string;
  year?: number;
  due_date?: string;
  submitted_date?: string;
  status: "draft" | "submitted" | "approved" | "revision_required";
  file_url?: string;
  submitted_by?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/** 마일스톤 */
export interface RndMilestone {
  id: string;
  rnd_id: string;
  title: string;
  description?: string;
  year?: number;
  target_date?: string;
  completed_date?: string;
  status: "pending" | "in_progress" | "completed" | "delayed";
  responsible_person?: string;
  deliverables?: string[];
  notes?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

/** 상담/활동 기록 */
export interface RndConsultation {
  id: string;
  rnd_id?: string;
  org_id?: string;
  user_id?: string;
  date?: string;
  activity_type?: string;
  title?: string;
  content?: string;
  attendees?: string[];
  action_items?: { task: string; assignee: string; due_date?: string; completed?: boolean }[];
  file_url?: string;
  created_at?: string;
  updated_at?: string;

  // Relations
  rnds?: RndProject;
  rnd_orgs?: RndOrg;
  users?: { id: string; name: string };
}

// =====================================================
// API 요청/응답 타입
// =====================================================

export interface RndProjectListResponse {
  data: RndProject[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RndBudgetSummary {
  rnd_id: string;
  year: number;
  category: RndBudgetCategory;
  budget_total: number;
  expenditure_total: number;
  remaining: number;
}

export interface RndProjectSummary {
  id: string;
  project_name: string;
  project_number?: string;
  status: RndProjectStatus;
  org_name?: string;
  pi_name?: string;
  start_date?: string;
  end_date?: string;
  total_budget: number;
  total_expenditure: number;
  researcher_count: number;
  outcome_count: number;
}

export interface CreateRndProjectRequest {
  name: string;
  project_number?: string;
  project_type?: RndProjectType;
  status?: RndProjectStatus;
  program_name?: string;
  org_id?: string;
  start_date?: string;
  end_date?: string;
  gov_contribution?: number;
  pri_contribution?: number;
  in_kind_contribution?: number;
  principal_investigator_id?: string;
  notes?: string;
}

export interface UpdateRndProjectRequest extends Partial<CreateRndProjectRequest> {
  id: string;
}
