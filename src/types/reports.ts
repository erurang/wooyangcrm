// 리포트 탭 타입
export type ReportTabType = "statistics" | "companies" | "employees" | "daily";

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
