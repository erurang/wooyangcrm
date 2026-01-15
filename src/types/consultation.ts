// 상담 관련 공유 타입 정의

// 원본 상담 데이터 (API 응답)
export interface BaseConsultation {
  id: string;
  date: string;
  follow_up_date: string | null;
  user_id: string;
  content: string;
  user_name?: string;
  contact_name?: string;
  documents?: ConsultationDocument[];
}

// 상담에 연결된 문서
export interface ConsultationDocument {
  type: string;
  id?: string;
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
  content: string;
  contact_name: string;
  contact_level: string;
  contact_email?: string;
  contact_mobile?: string;
  contact_id?: string;
  documents: {
    estimate: boolean;
    order: boolean;
    requestQuote: boolean;
  };
}

// 상담 폼 데이터
export interface ConsultationFormData {
  date: string;
  follow_up_date: string;
  contact_name: string | undefined;
  user_id: string;
  content: string;
}
