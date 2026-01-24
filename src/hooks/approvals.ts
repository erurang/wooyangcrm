import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useState } from "react";
import type {
  ApprovalRequestWithRelations,
  ApprovalCategory,
  ApprovalListResponse,
  ApprovalDashboardSummary,
  ApprovalRequestFormData,
  ApprovalActionData,
  ApprovalFilters,
  ApprovalListTab,
} from "@/types/approval";
import type { FormSchema } from "@/components/approvals/DynamicApprovalForm";

// 확장된 카테고리 타입 (form_schema 포함)
export interface ApprovalCategoryWithSchema extends ApprovalCategory {
  form_schema?: FormSchema;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * 결재 목록 조회 훅
 */
export function useApprovals(options: {
  tab?: ApprovalListTab;
  userId?: string;
  filters?: ApprovalFilters;
  page?: number;
  limit?: number;
}) {
  const { tab = "all", userId, filters, page = 1, limit = 20 } = options;

  const params = new URLSearchParams();
  params.set("tab", tab);
  params.set("limit", limit.toString());
  params.set("offset", ((page - 1) * limit).toString());

  if (userId) {
    params.set("approver_id", userId);
    if (tab === "requested") {
      params.set("requester_id", userId);
    }
  }

  if (filters?.status) params.set("status", filters.status);
  if (filters?.category_id) params.set("category_id", filters.category_id);
  if (filters?.keyword) params.set("keyword", filters.keyword);
  if (filters?.start_date) params.set("start_date", filters.start_date);
  if (filters?.end_date) params.set("end_date", filters.end_date);

  const { data, error, mutate, isValidating } = useSWR<ApprovalListResponse>(
    `/api/approvals?${params.toString()}`,
    fetcher
  );

  return {
    approvals: data?.data || [],
    total: data?.totalCount || 0,
    totalPages: data?.totalPages || 0,
    isLoading: !data && !error,
    isValidating,
    error,
    mutate,
  };
}

/**
 * 결재 상세 조회 훅
 */
export function useApprovalDetail(id: string | null) {
  const { data, error, mutate, isValidating } =
    useSWR<ApprovalRequestWithRelations>(
      id ? `/api/approvals/${id}` : null,
      fetcher
    );

  return {
    approval: data,
    isLoading: !data && !error,
    isValidating,
    error,
    mutate,
  };
}

/**
 * 결재 카테고리 목록 조회 훅
 */
export function useApprovalCategories() {
  const { data, error, mutate } = useSWR<ApprovalCategory[]>(
    "/api/approvals/categories",
    fetcher
  );

  return {
    categories: data || [],
    isLoading: !data && !error,
    error,
    mutate,
  };
}

/**
 * 결재 요약 정보 조회 훅
 */
export function useApprovalSummary(userId: string | null) {
  const { data, error, mutate } = useSWR<ApprovalDashboardSummary>(
    userId ? `/api/approvals/summary?user_id=${userId}` : null,
    fetcher,
    { refreshInterval: 30000 } // 30초마다 자동 갱신
  );

  return {
    summary: data,
    isLoading: !data && !error,
    error,
    mutate,
  };
}

/**
 * 결재 통계 정보 조회 훅
 */
export interface ApprovalStatistics {
  monthly: Array<{
    month: string;
    approved: number;
    rejected: number;
    pending: number;
  }>;
  categories: Array<{
    category_id: string;
    category_name: string;
    count: number;
    approved: number;
    rejected: number;
    pending: number;
  }>;
  processing_time: {
    avg_hours: number;
    min_hours: number;
    max_hours: number;
    total_completed: number;
  };
  summary: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    draft: number;
    approval_rate: number;
  };
}

export function useApprovalStatistics(userId?: string | null, scope: "all" | "my" = "all") {
  const params = new URLSearchParams();
  params.set("scope", scope);
  if (userId) params.set("user_id", userId);

  const { data, error, mutate } = useSWR<ApprovalStatistics>(
    `/api/approvals/statistics?${params.toString()}`,
    fetcher,
    { refreshInterval: 60000 } // 1분마다 자동 갱신
  );

  return {
    statistics: data,
    isLoading: !data && !error,
    error,
    mutate,
  };
}

/**
 * 결재 요청 생성 훅
 */
export function useCreateApproval() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createApproval = async (data: ApprovalRequestFormData & {
    requester_id: string;
    requester_team_id?: string;
    requester_department?: string;
    is_draft?: boolean;
    files?: Array<{
      file_name: string;
      file_url: string;
      file_size?: number;
      file_type?: string;
    }>;
  }): Promise<ApprovalRequestWithRelations | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "결재 요청 생성에 실패했습니다.");
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "오류가 발생했습니다.";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { createApproval, isLoading, error };
}

/**
 * 결재 요청 수정 훅
 */
export function useUpdateApproval() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateApproval = async (
    id: string,
    data: Partial<ApprovalRequestFormData> & {
      user_id: string;
      is_submit?: boolean;
      files?: Array<{
        file_name: string;
        file_url: string;
        file_size?: number;
        file_type?: string;
      }>;
    }
  ): Promise<ApprovalRequestWithRelations | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/approvals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "결재 요청 수정에 실패했습니다.");
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "오류가 발생했습니다.";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateApproval, isLoading, error };
}

/**
 * 결재 요청 삭제 훅
 */
export function useDeleteApproval() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteApproval = async (
    id: string,
    userId: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/approvals/${id}?user_id=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "결재 요청 삭제에 실패했습니다.");
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "오류가 발생했습니다.";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteApproval, isLoading, error };
}

/**
 * 결재 액션 (승인/반려/위임/회수) 훅
 */
export function useApprovalAction() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAction = async (
    id: string,
    actionData: ApprovalActionData & { user_id: string }
  ): Promise<{ success: boolean; message?: string; is_final?: boolean }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/approvals/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "결재 처리에 실패했습니다.");
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "오류가 발생했습니다.";
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  // 편의 메서드들
  const approve = (id: string, userId: string, comment?: string) =>
    performAction(id, { action: "approve", user_id: userId, comment });

  const reject = (id: string, userId: string, comment: string) =>
    performAction(id, { action: "reject", user_id: userId, comment });

  const delegate = (
    id: string,
    userId: string,
    delegatedTo: string,
    delegatedReason?: string
  ) =>
    performAction(id, {
      action: "delegate",
      user_id: userId,
      delegated_to: delegatedTo,
      delegated_reason: delegatedReason,
    });

  const withdraw = (id: string, userId: string) =>
    performAction(id, { action: "withdraw", user_id: userId });

  return {
    approve,
    reject,
    delegate,
    withdraw,
    isLoading,
    error,
  };
}

// ====================================
// 자동 결재선 관련 훅
// ====================================

export interface ResolvedApprovalLine {
  approver_id: string;
  approver_name: string;
  approver_position: string;
  approver_team?: string;
  line_type: "approval" | "review" | "reference";
  line_order: number;
  is_required: boolean;
}

interface RequesterInfo {
  id: string;
  name: string;
  position: string;
  team?: string;
  department?: string;
}

interface ResolveApprovalLinesResponse {
  lines: ResolvedApprovalLine[];
  requester: RequesterInfo;
}

interface ResolveApprovalLinesRequest {
  category_id: string;
  requester_id: string;
}

async function resolveApprovalLinesFetcher(
  url: string,
  { arg }: { arg: ResolveApprovalLinesRequest }
) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "결재선 결정 실패");
  }

  return response.json() as Promise<ResolveApprovalLinesResponse>;
}

/**
 * 자동 결재선 결정 훅
 *
 * 사용 예시:
 * const { resolveLines, isLoading, error } = useResolveApprovalLines();
 *
 * // 카테고리 선택 시 호출
 * const result = await resolveLines({
 *   category_id: selectedCategoryId,
 *   requester_id: currentUserId,
 * });
 */
export function useResolveApprovalLines() {
  const { trigger, isMutating, error, data } = useSWRMutation(
    "/api/approvals/resolve-lines",
    resolveApprovalLinesFetcher
  );

  return {
    resolveLines: trigger,
    isLoading: isMutating,
    error: error?.message,
    data,
  };
}

/**
 * 결재 카테고리 목록 조회 훅 (form_schema 포함)
 */
export function useApprovalCategoriesWithSchema() {
  const { data, error, mutate } = useSWR<ApprovalCategoryWithSchema[]>(
    "/api/approvals/categories",
    fetcher
  );

  return {
    categories: data || [],
    isLoading: !data && !error,
    error,
    mutate,
  };
}
