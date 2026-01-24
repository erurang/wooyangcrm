import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface ApprovalRuleConditions {
  maxAmount?: number;
  categoryId?: string;
  requesterId?: string;
}

export interface ApprovalRule {
  id: string;
  name: string;
  description: string | null;
  conditions: ApprovalRuleConditions;
  action: "auto_approve" | "skip_step" | "notify_only";
  priority: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  creator?: {
    id: string;
    name: string;
  };
}

export interface CreateRuleRequest {
  name: string;
  description?: string;
  conditions: ApprovalRuleConditions;
  action: "auto_approve" | "skip_step" | "notify_only";
  priority?: number;
  is_active?: boolean;
  created_by?: string;
}

export interface UpdateRuleRequest {
  name?: string;
  description?: string;
  conditions?: ApprovalRuleConditions;
  action?: "auto_approve" | "skip_step" | "notify_only";
  priority?: number;
  is_active?: boolean;
}

/**
 * 결재 규칙 목록 조회 훅
 */
export function useApprovalRules(activeOnly: boolean = false) {
  const url = `/api/approvals/rules${activeOnly ? "?active=true" : ""}`;

  const { data, error, isLoading, mutate } = useSWR<{ rules: ApprovalRule[] }>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
    }
  );

  // 규칙 생성
  const createRule = async (ruleData: CreateRuleRequest): Promise<ApprovalRule> => {
    const response = await fetch("/api/approvals/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ruleData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "규칙 생성에 실패했습니다.");
    }

    const result = await response.json();
    mutate();
    return result.rule;
  };

  // 규칙 수정
  const updateRule = async (
    id: string,
    ruleData: UpdateRuleRequest
  ): Promise<ApprovalRule> => {
    const response = await fetch(`/api/approvals/rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ruleData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "규칙 수정에 실패했습니다.");
    }

    const result = await response.json();
    mutate();
    return result.rule;
  };

  // 규칙 삭제
  const deleteRule = async (id: string): Promise<void> => {
    const response = await fetch(`/api/approvals/rules/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "규칙 삭제에 실패했습니다.");
    }

    mutate();
  };

  // 규칙 활성화/비활성화 토글
  const toggleRule = async (id: string, isActive: boolean): Promise<void> => {
    await updateRule(id, { is_active: isActive });
  };

  return {
    rules: data?.rules || [],
    isLoading,
    isError: !!error,
    mutate,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
}

// 액션 라벨
export function getActionLabel(
  action: "auto_approve" | "skip_step" | "notify_only"
): string {
  switch (action) {
    case "auto_approve":
      return "자동 승인";
    case "skip_step":
      return "단계 건너뛰기";
    case "notify_only":
      return "알림만";
    default:
      return action;
  }
}

// 액션 색상
export function getActionColor(
  action: "auto_approve" | "skip_step" | "notify_only"
): { bg: string; text: string } {
  switch (action) {
    case "auto_approve":
      return { bg: "bg-green-100", text: "text-green-700" };
    case "skip_step":
      return { bg: "bg-blue-100", text: "text-blue-700" };
    case "notify_only":
      return { bg: "bg-yellow-100", text: "text-yellow-700" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-700" };
  }
}

// 금액 포맷팅
export function formatAmount(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(0)}억원`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만원`;
  }
  return `${amount.toLocaleString()}원`;
}
