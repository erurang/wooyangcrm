// Dashboard 관련 타입 정의

/**
 * 문서 아이템 (품목)
 */
export interface DashboardDocumentItem {
  name: string;
  spec?: string;
  quantity: string;
  unit_price: number;
  amount: number;
  number?: number;
  unit?: string;
}

/**
 * 문서 담당자
 */
export interface DocumentUser {
  id: string;
  name: string;
  level?: string;
}

/**
 * 문서 (견적서, 발주서 등)
 */
export interface DashboardDocument {
  document_id: string;
  document_number: string;
  type: "estimate" | "order" | "requestQuote";
  status: "pending" | "completed" | "canceled" | "expired";
  date?: string;
  created_at?: string;
  valid_until?: string;
  delivery_date?: string;
  items: DashboardDocumentItem[];
  total_amount?: number;
  notes?: string;
  user?: DocumentUser;
}

/**
 * 상담 내역
 */
export interface DashboardConsultation {
  consultation_id: string;
  company_id: string;
  company_name: string;
  contact_id?: string;
  contact_name?: string;
  date: string;
  content?: string;
  status?: string;
  documents: DashboardDocument[];
}

/**
 * 사용자별 데이터 (documentsDetails 배열의 각 항목)
 */
export interface DashboardUserData {
  user_id: string;
  user_name?: string;
  consultations: DashboardConsultation[];
}

/**
 * 집계 데이터 아이템 (aggregateData용)
 */
export interface AggregatedItem {
  name: string;
  spec?: string;
  quantity: string;
  total: number;
  type?: "sales" | "purchase";
}

/**
 * 거래처 분석 데이터
 */
export interface ClientAnalysis {
  id: string;
  name: string;
  consultations: number;
  estimates: number;
  orders: number;
  totalSales: number;
  totalPurchases: number;
}

/**
 * 차트 데이터
 */
export interface ChartData {
  labels: string[];
  data: number[];
}

/**
 * 거래처별 금액 데이터
 */
export interface CompanyTotal {
  name: string;
  total: number;
}

/**
 * 문서 카운트
 */
export interface DocumentCounts {
  pending: number;
  completed: number;
  canceled: number;
  total: number;
}

/**
 * 전체 문서 합계 결과
 */
export interface AllDocumentTotals {
  completedSales: number;
  completedPurchases: number;
  pendingSales: number;
  pendingPurchases: number;
  canceledSales: number;
  canceledPurchases: number;
  estimates: DocumentCounts;
  orders: DocumentCounts;
}

/**
 * 성과 지표
 */
export interface PerformanceMetrics {
  targetAchievementRate: number;
  estimateSuccessRate: number;
  avgTransactionAmount: number;
  minTransactionAmount: number;
  maxTransactionAmount: number;
  consultationToEstimateRate: number;
}

/**
 * 월별 트렌드 데이터
 */
export interface MonthlyTrendData {
  months: string[];
  salesData: number[];
  purchaseData: number[];
}

/**
 * 만료 예정 문서
 */
export interface ExpiringDocument {
  id: string;
  company_name: string;
  valid_until: string;
  total_amount: number;
}

/**
 * 사용자 정보 (성과 계산용)
 */
export interface DashboardUser {
  id: string;
  name: string;
  target?: number;
  level?: string;
  position?: string;
}

/**
 * 날짜 필터 타입
 */
export type DateFilterType = "year" | "quarter" | "month";
