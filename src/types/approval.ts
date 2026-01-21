// ================================
// 결재시스템 (Approval System) 타입 정의
// ================================

import { User, Team } from "./index";

/**
 * 결재선 타입
 * - approval: 결재/승인 (결정권 있음)
 * - review: 검토 (의견 제시)
 * - reference: 참조 (열람만)
 */
export type ApprovalLineType = "approval" | "review" | "reference";

/**
 * 결재선 상태
 */
export type ApprovalLineStatus =
  | "pending"    // 대기 중
  | "approved"   // 승인
  | "rejected"   // 반려
  | "delegated"  // 위임됨
  | "skipped";   // 건너뜀

/**
 * 결재 요청 상태
 */
export type ApprovalRequestStatus =
  | "draft"      // 임시저장
  | "pending"    // 결재 진행 중
  | "approved"   // 최종 승인
  | "rejected"   // 반려
  | "withdrawn"; // 기안자 취소

/**
 * 결재 문서 유형
 */
export interface ApprovalCategory {
  id: string;
  name: string;                    // 지출품의서, 휴가신청서 등
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * 결재선 템플릿
 */
export interface ApprovalTemplate {
  id: string;
  category_id: string;
  team_id?: string;
  name: string;
  description?: string;
  is_default: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  category?: ApprovalCategory;
  team?: Team;
  lines?: ApprovalTemplateLine[];
}

/**
 * 결재선 템플릿 상세 (결재자 목록)
 */
export interface ApprovalTemplateLine {
  id: string;
  template_id: string;
  approver_type: "user" | "position" | "role";
  approver_id?: string;
  approver_position?: string;      // 팀장, 부장, 사업장장 등
  line_type: ApprovalLineType;
  line_order: number;
  is_required: boolean;
  created_at?: string;
  user?: User;
}

/**
 * 결재 요청 (실제 결재 문서)
 */
export interface ApprovalRequest {
  id: string;
  document_number: string;         // 2026APR00000001
  category_id: string;
  title: string;
  content?: string;                // HTML 또는 텍스트

  // 기안자 정보
  requester_id: string;
  requester_team_id?: string;
  requester_department?: string;

  // 상태
  status: ApprovalRequestStatus;
  current_line_order: number;

  // 관련 문서
  related_document_id?: string;
  related_consultation_id?: string;

  // 시간
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
  completed_at?: string;
}

/**
 * 결재 요청 + 관계 데이터
 */
export interface ApprovalRequestWithRelations extends ApprovalRequest {
  category?: ApprovalCategory;
  requester?: User;
  requester_team?: Team;
  lines?: ApprovalLine[];
  files?: ApprovalFile[];
  share_setting?: ApprovalShareSetting;
  shares?: ApprovalShare[];
}

/**
 * 결재선 (각 요청의 결재자 목록)
 */
export interface ApprovalLine {
  id: string;
  request_id: string;
  approver_id: string;
  approver_team?: string;          // 결재 시점 소속
  line_type: ApprovalLineType;
  line_order: number;

  // 결재 상태
  status: ApprovalLineStatus;
  comment?: string;                // 결재 의견
  acted_at?: string;

  // 위임 정보
  delegated_to?: string;
  delegated_reason?: string;

  is_required: boolean;
  created_at?: string;

  // 관계
  approver?: User;
  delegated_user?: User;
}

/**
 * 결재 첨부파일
 */
export interface ApprovalFile {
  id: string;
  request_id: string;
  user_id?: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  description?: string;
  created_at?: string;
  user?: User;
}

/**
 * 공유 범위 설정
 */
export interface ApprovalShareSetting {
  id: string;
  request_id: string;
  share_scope: "all" | "partial";  // 전체 공유 / 일부 공유
  created_at?: string;
  updated_at?: string;
}

/**
 * 공유 대상 (일부 공유 시)
 */
export interface ApprovalShare {
  id: string;
  request_id: string;
  user_id: string;
  share_type: "view" | "edit";
  shared_by?: string;
  created_at?: string;
  user?: User;
}

/**
 * 결재 히스토리 (감사 로그)
 */
export interface ApprovalHistory {
  id: string;
  request_id: string;
  user_id?: string;
  action: ApprovalHistoryAction;
  action_detail?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
  user?: User;
}

export type ApprovalHistoryAction =
  | "created"
  | "submitted"
  | "approved"
  | "rejected"
  | "delegated"
  | "withdrawn"
  | "comment_added"
  | "file_uploaded"
  | "file_deleted"
  | "share_updated";

// ================================
// Form/Input Types
// ================================

/**
 * 결재 요청 생성 폼 데이터
 */
export interface ApprovalRequestFormData {
  category_id: string;
  title: string;
  content?: string;
  lines: ApprovalLineFormData[];
  share_scope: "all" | "partial";
  share_users?: string[];           // 일부 공유 시 사용자 ID 목록
}

/**
 * 결재선 폼 데이터
 */
export interface ApprovalLineFormData {
  approver_id: string;
  line_type: ApprovalLineType;
  line_order: number;
  is_required?: boolean;
}

/**
 * 결재 액션 데이터
 */
export interface ApprovalActionData {
  action: "approve" | "reject" | "delegate" | "withdraw";
  comment?: string;
  delegated_to?: string;           // 위임 시 대상자
  delegated_reason?: string;       // 위임 사유
}

// ================================
// Filter/Search Types
// ================================

/**
 * 결재 목록 필터
 */
export interface ApprovalFilters {
  status?: ApprovalRequestStatus;
  category_id?: string;
  requester_id?: string;
  keyword?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * 결재 목록 탭 타입
 */
export type ApprovalListTab =
  | "all"           // 전체
  | "pending"       // 결재 대기 (내가 결재할 차례)
  | "requested"     // 내가 기안한 문서
  | "approved"      // 완료된 문서
  | "reference";    // 참조 문서

// ================================
// API Response Types
// ================================

/**
 * 결재 목록 응답
 */
export interface ApprovalListResponse {
  data: ApprovalRequestWithRelations[];
  totalCount: number;
  totalPages: number;
  page: number;
  limit: number;
}

/**
 * 결재 대시보드 요약
 */
export interface ApprovalDashboardSummary {
  pending_count: number;           // 내가 결재할 문서 수
  requested_count: number;         // 내가 기안한 진행 중 문서 수
  approved_count: number;          // 이번 달 승인된 문서 수
  rejected_count: number;          // 이번 달 반려된 문서 수
}

// ================================
// Helper Functions
// ================================

/**
 * 결재선 타입 라벨
 */
export const APPROVAL_LINE_TYPE_LABELS: Record<ApprovalLineType, string> = {
  approval: "결재",
  review: "검토",
  reference: "참조",
};

/**
 * 결재선 상태 라벨
 */
export const APPROVAL_LINE_STATUS_LABELS: Record<ApprovalLineStatus, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "반려",
  delegated: "위임",
  skipped: "건너뜀",
};

/**
 * 결재 요청 상태 라벨
 */
export const APPROVAL_REQUEST_STATUS_LABELS: Record<ApprovalRequestStatus, string> = {
  draft: "임시저장",
  pending: "진행 중",
  approved: "승인완료",
  rejected: "반려",
  withdrawn: "회수",
};

/**
 * 결재 요청 상태 색상 (MUI 색상)
 */
export const APPROVAL_REQUEST_STATUS_COLORS: Record<ApprovalRequestStatus, string> = {
  draft: "default",
  pending: "primary",
  approved: "success",
  rejected: "error",
  withdrawn: "warning",
};

/**
 * 결재선 상태 색상
 */
export const APPROVAL_LINE_STATUS_COLORS: Record<ApprovalLineStatus, string> = {
  pending: "default",
  approved: "success",
  rejected: "error",
  delegated: "info",
  skipped: "warning",
};

/**
 * 결재선 타입별 배지 색상
 */
export const APPROVAL_LINE_TYPE_COLORS: Record<ApprovalLineType, string> = {
  approval: "primary",
  review: "secondary",
  reference: "default",
};

/**
 * 결재 가능 여부 체크
 */
export function canApprove(
  request: ApprovalRequestWithRelations,
  userId: string
): boolean {
  if (request.status !== "pending") return false;

  const currentLine = request.lines?.find(
    (line) =>
      line.line_order === request.current_line_order &&
      line.status === "pending"
  );

  if (!currentLine) return false;

  // 본인이 결재자이거나 위임받은 경우
  return (
    currentLine.approver_id === userId ||
    currentLine.delegated_to === userId
  );
}

/**
 * 문서 수정 가능 여부 체크
 */
export function canEditRequest(
  request: ApprovalRequest,
  userId: string
): boolean {
  return (
    request.requester_id === userId &&
    (request.status === "draft" || request.status === "rejected")
  );
}

/**
 * 문서 회수 가능 여부 체크
 */
export function canWithdrawRequest(
  request: ApprovalRequest,
  userId: string
): boolean {
  return (
    request.requester_id === userId &&
    request.status === "pending"
  );
}
