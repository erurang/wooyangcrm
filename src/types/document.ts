// Document related types

export interface AppUser {
  id: string;
  name: string;
}

export interface DocumentItem {
  name: string;
  spec?: string;
  quantity: string | number;
  unit_price: number;
  amount: number;
  number?: number;
  unit?: string;
}

// DB 테이블 기반 DocumentItem (document_items 테이블)
export interface DocumentItemDB {
  id: string;
  document_id: string;
  product_id: string | null;
  item_number: number;
  name: string;
  spec: string | null;
  internal_name: string | null;
  internal_spec: string | null;
  quantity: string;
  unit: string | null;
  unit_price: number;
  amount: number;
  created_at: string;
  updated_at: string;
  // 조인된 데이터
  product?: {
    id: string;
    internal_code: string;
    internal_name: string;
    spec: string | null;
    current_stock: number;
  };
}

// content는 items만 포함 (나머지 필드는 별도 컬럼으로 분리됨)
// 레거시 호환성을 위해 선택적 필드 포함
export interface DocumentContent {
  items: DocumentItem[];
  // Legacy fallback fields (마이그레이션 전 데이터 호환용)
  company_name?: string | null;
  notes?: string | null;
  total_amount?: number | null;
  valid_until?: string | null;
  delivery_term?: string | null;
  delivery_place?: string | null;
  delivery_date?: string | null;
  payment_method?: string | null;
}

export interface Document {
  id: string;
  date: string;
  consultation_id: string;
  type: string;
  contact: string;
  contact_name: string;
  contact_level: string;
  user_name: string;
  user_level: string;
  contact_mobile: string;
  content: DocumentContent;
  payment_method: string;
  document_number: string;
  status: string;
  created_at: string;
  file_url: string;
  company_id: string;
  user_id: string;
  // 분리된 컬럼들
  company_name?: string | null;
  company_phone?: string | null;
  company_fax?: string | null;
  notes: string | null;
  valid_until: string | null;
  delivery_date: string | null;
  delivery_date_note?: string | null; // 납기일 외부 표시용 (빠른시일내 등)
  total_amount: number;
  delivery_term: string | null;
  delivery_place: string | null;
  // 리뷰/상태 관련
  review_reason?: string | null;
  status_reason?: StatusReason | null;
}

export interface NewDocument {
  id: string;
  date: string;
  company_name: string;
  contact: string;
  phone: string;
  fax: string;
  created_at: string;
  valid_until: string;
  payment_method: string;
  notes: string;
  delivery_term: string;
  delivery_place: string;
  status: string;
  delivery_date: string;
  delivery_date_note: string; // 납기일 외부 표시용 (빠른시일내 등)
}

export interface Contact {
  resign: boolean | null;
  id: string;
  contact_name: string;
  department: string;
  mobile: string;
  email: string;
  company_id: string;
  level: string;
}

export interface StatusReason {
  completed: { reason: string; amount?: number };
  canceled: { reason: string; amount?: number };
}

export type DocumentType = "estimate" | "order" | "requestQuote";

export function getDocumentTypeText(type: string): string {
  switch (type) {
    case "estimate":
      return "견적서";
    case "order":
      return "발주서";
    case "requestQuote":
      return "견적의뢰서";
    default:
      return "";
  }
}

export function getDocumentTypeLabel(type: string): {
  dateLabel: string;
  validLabel: string;
  userLabel: string;
  contentLabel: string;
} {
  switch (type) {
    case "estimate":
      return {
        dateLabel: "견적일",
        validLabel: "유효기간",
        userLabel: "견적자",
        contentLabel: "견적내용",
      };
    case "order":
      return {
        dateLabel: "발주일",
        validLabel: "납기일",
        userLabel: "발주자",
        contentLabel: "발주내역",
      };
    case "requestQuote":
      return {
        dateLabel: "의뢰일",
        validLabel: "희망견적일",
        userLabel: "의뢰자",
        contentLabel: "의뢰내역",
      };
    default:
      return {
        dateLabel: "",
        validLabel: "",
        userLabel: "",
        contentLabel: "",
      };
  }
}
