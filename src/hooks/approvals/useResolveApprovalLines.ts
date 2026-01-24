import useSWRMutation from "swr/mutation";

interface ResolvedApprovalLine {
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

export type { ResolvedApprovalLine, RequesterInfo, ResolveApprovalLinesRequest };
