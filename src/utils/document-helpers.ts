// Document helper functions

export const DOC_TYPES = ["estimate", "order", "requestQuote"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export function getStatusText(status: string): string {
  switch (status) {
    case "pending":
      return "진행 중";
    case "completed":
      return "완료됨";
    case "canceled":
      return "취소됨";
    default:
      return "알 수 없음";
  }
}

export function getDocTypeLabel(type: string): string {
  switch (type) {
    case "estimate":
      return "견적서";
    case "order":
      return "발주서";
    case "requestQuote":
      return "의뢰서";
    default:
      return "기타 문서";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "text-amber-600 bg-amber-50";
    case "completed":
      return "text-emerald-600 bg-emerald-50";
    case "canceled":
      return "text-rose-600 bg-rose-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}
