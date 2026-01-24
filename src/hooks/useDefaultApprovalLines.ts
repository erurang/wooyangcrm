import useSWR from "swr";
import useSWRMutation from "swr/mutation";

export interface DefaultApprovalLine {
  id: string;
  category_id: string;
  team_id?: string;
  department_id?: string;
  approver_type: "position" | "role" | "user";
  approver_value: string;
  line_type: "approval" | "review" | "reference";
  line_order: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string };
  team?: { id: string; name: string };
  department?: { id: string; name: string };
}

export interface CreateDefaultLineRequest {
  category_id: string;
  team_id?: string;
  department_id?: string;
  approver_type: "position" | "role" | "user";
  approver_value: string;
  line_type?: "approval" | "review" | "reference";
  line_order: number;
  is_required?: boolean;
}

export interface UpdateDefaultLineRequest {
  approver_type?: "position" | "role" | "user";
  approver_value?: string;
  line_type?: "approval" | "review" | "reference";
  line_order?: number;
  is_required?: boolean;
}

// 기본 결재선 목록 조회
async function fetchDefaultLines(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch default lines");
  return response.json();
}

// 기본 결재선 생성
async function createLineFetcher(
  url: string,
  { arg }: { arg: CreateDefaultLineRequest }
) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "생성 실패");
  }
  return response.json();
}

// 기본 결재선 수정
async function updateLineFetcher(
  url: string,
  { arg }: { arg: { id: string; data: UpdateDefaultLineRequest } }
) {
  const response = await fetch(
    `/api/admin/approvals/default-lines/${arg.id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(arg.data),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "수정 실패");
  }
  return response.json();
}

// 기본 결재선 삭제
async function deleteLineFetcher(
  url: string,
  { arg }: { arg: string }
) {
  const response = await fetch(
    `/api/admin/approvals/default-lines/${arg}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "삭제 실패");
  }
  return response.json();
}

// 대량 업데이트
async function bulkUpdateFetcher(
  url: string,
  { arg }: { arg: { category_id: string; lines: Omit<CreateDefaultLineRequest, "category_id">[] } }
) {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "대량 업데이트 실패");
  }
  return response.json();
}

export function useDefaultApprovalLines(categoryId?: string) {
  const url = categoryId
    ? `/api/admin/approvals/default-lines?category_id=${categoryId}`
    : "/api/admin/approvals/default-lines";

  const { data, error, isLoading, mutate } = useSWR(url, fetchDefaultLines);

  const { trigger: createLine, isMutating: isCreating } = useSWRMutation(
    "/api/admin/approvals/default-lines",
    createLineFetcher
  );

  const { trigger: updateLine, isMutating: isUpdating } = useSWRMutation(
    "/api/admin/approvals/default-lines",
    updateLineFetcher
  );

  const { trigger: deleteLine, isMutating: isDeleting } = useSWRMutation(
    "/api/admin/approvals/default-lines",
    deleteLineFetcher
  );

  const { trigger: bulkUpdate, isMutating: isBulkUpdating } = useSWRMutation(
    "/api/admin/approvals/default-lines",
    bulkUpdateFetcher
  );

  // 카테고리별로 그룹화된 데이터
  const groupedData: Record<string, DefaultApprovalLine[]> = data?.data || {};

  // 플랫 리스트
  const lines: DefaultApprovalLine[] = Object.values(groupedData).flat();

  return {
    lines,
    groupedData,
    isLoading,
    error: error?.message,
    isCreating,
    isUpdating,
    isDeleting,
    isBulkUpdating,
    createLine: async (data: CreateDefaultLineRequest) => {
      const result = await createLine(data);
      await mutate();
      return result;
    },
    updateLine: async (id: string, data: UpdateDefaultLineRequest) => {
      const result = await updateLine({ id, data });
      await mutate();
      return result;
    },
    deleteLine: async (id: string) => {
      const result = await deleteLine(id);
      await mutate();
      return result;
    },
    bulkUpdate: async (
      categoryId: string,
      lines: Omit<CreateDefaultLineRequest, "category_id">[]
    ) => {
      const result = await bulkUpdate({ category_id: categoryId, lines });
      await mutate();
      return result;
    },
    refresh: mutate,
  };
}

// 직급 목록 조회
export function usePositionHierarchy() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/admin/position-hierarchy",
    fetchDefaultLines
  );

  return {
    positions: data?.data || [],
    isLoading,
    error: error?.message,
    refresh: mutate,
  };
}

// 결재선 타입 라벨
export const LINE_TYPE_LABELS: Record<string, string> = {
  approval: "결재",
  review: "검토",
  reference: "참조",
};

// 결재자 타입 라벨
export const APPROVER_TYPE_LABELS: Record<string, string> = {
  position: "직급",
  role: "역할",
  user: "특정 사용자",
};
