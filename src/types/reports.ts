// 리포트 탭 타입
export type ReportTabType = "statistics" | "companies" | "employees" | "daily" | "production";

// 기간 필터 타입
export type DateFilterType = "year" | "quarter" | "month";

// 매출/매입 통계 데이터
export interface SalesStatistics {
  period: string;
  sales: number;
  purchases: number;
  profit: number;
  salesCount: number;
  purchaseCount: number;
}

// 월별 통계
export interface MonthlyStat {
  month: number;
  sales: number;
  purchases: number;
  salesCount: number;
  purchaseCount: number;
}

// 거래처별 실적
export interface CompanyPerformance {
  id: string;
  name: string;
  totalSales: number;
  totalPurchases: number;
  estimateCount: number;
  orderCount: number;
  lastTransaction: string;
  assignedUsers: string[];
  rank?: number;
}

// 직원별 실적
export interface EmployeePerformance {
  id: string;
  name: string;
  position: string;
  totalSales: number;
  totalPurchases: number;
  consultationCount: number;
  completedCount: number;
  pendingCount: number;
  canceledCount: number;
  rank?: number;
}

// 일보/월보 문서
export interface ReportDocument {
  id: string;
  date: string;
  documentNumber: string;
  type: "estimate" | "order";
  status: string;
  companyName: string;
  amount: number;
  userName: string;
}

// 일보/월보 요약
export interface DailyReportSummary {
  date: string;
  estimateCount: number;
  orderCount: number;
  totalSales: number;
  totalPurchases: number;
}

// 생산팀 개인 실적
export interface ProductionUserPerformance {
  user_id: string;
  user_name: string;
  position: string;
  completed_count: number;
  on_time_rate: number;
  avg_processing_days: number;
  inventory_completed: number;
  production_records: number;
  production_quantity: number;
  rank?: number;
}

// 생산팀 실적 요약
export interface ProductionPerformanceSummary {
  total_completed: number;
  on_time_rate: number;
  avg_processing_days: number;
  inventory_tasks_completed: number;
  production_records_count: number;
  production_quantity_total: number;
}

// 생산팀 월별 추이
export interface ProductionMonthlyTrend {
  month: string;
  completed: number;
  on_time: number;
}

// 생산팀 실적 API 응답
export interface ProductionPerformanceResponse {
  summary: ProductionPerformanceSummary;
  monthly_trend: ProductionMonthlyTrend[];
  by_user: ProductionUserPerformance[];
}
