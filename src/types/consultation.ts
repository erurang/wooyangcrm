// 상담 관련 공유 타입 정의

// 접수 경로 타입
export type ContactMethod = "phone" | "online" | "email" | "meeting" | "exhibition" | "visit" | "other";

// 접수 경로 라벨
export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  phone: "전화",
  online: "온라인문의",
  email: "메일",
  meeting: "미팅",
  exhibition: "전시회",
  visit: "방문",
  other: "기타",
};

// 원본 상담 데이터 (API 응답)
export interface BaseConsultation {
  id: string;
  date: string;
  follow_up_date: string | null;
  user_id: string;
  title?: string;
  content: string;
  contact_method?: ContactMethod;
  user_name?: string;
  contact_name?: string;
  documents?: ConsultationDocument[];
  created_at?: string; // 실제 등록 시간 (정렬 및 표시용)
}

// 상담에 연결된 문서
export interface ConsultationDocument {
  type: string;
  id?: string;
  document_number?: string;
  status?: string;
}

// 상담-담당자 연결 정보
export interface ConsultationContactRelation {
  consultation_id: string;
  contacts?: {
    id: string;
    contact_name: string;
    mobile: string;
    department: string;
    level: string;
    email: string;
    resign: boolean;
    sort_order: number | null;
    company_id?: string;
  };
}

// 처리된 상담 데이터 (UI 표시용)
export interface ProcessedConsultation {
  id: string;
  date: string;
  follow_up_date: string | null;
  user_id: string;
  title?: string;
  content: string;
  contact_method?: ContactMethod;
  contact_name: string;
  contact_level: string;
  contact_email?: string;
  contact_mobile?: string;
  contact_id?: string;
  created_at?: string; // 실제 등록 시간
  documents: {
    estimate: boolean;
    order: boolean;
    requestQuote: boolean;
  };
  rawDocuments?: ConsultationDocument[];
}

// 상담 폼 데이터
export interface ConsultationFormData {
  date: string;
  follow_up_date: string;
  contact_name: string | undefined;
  user_id: string;
  title: string;
  content: string;
  contact_method: ContactMethod;
}
