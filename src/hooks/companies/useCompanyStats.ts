import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface DocumentStat {
  total: number;
  completed: number;
  pending: number;
  canceled: number;
  amount: number;
  avgAmount: number;
}

export interface MonthlyData {
  month: string;
  estimateAmount: number;
  orderAmount: number;
  estimateCount: number;
  orderCount: number;
  consultationCount: number;
}

export interface YearlyData {
  year: number;
  sales: number;
  purchases: number;
  consultations: number;
  documents: number;
}

export interface QuarterlyData {
  quarter: string;
  sales: number;
  purchases: number;
  consultations: number;
}

export interface TopProduct {
  name: string;
  spec: string;
  totalAmount: number;
  totalQuantity: number;
  count: number;
}

export interface UserActivity {
  userId: string;
  name: string;
  documents: number;
  consultations: number;
  totalAmount: number;
}

export interface RecentDocument {
  id: string;
  type: "estimate" | "order" | "requestQuote";
  document_number: string;
  status: string;
  total_amount: number;
  date: string;
}

export interface ComparisonData {
  current: number;
  previous: number;
  change: number | null;
}

export interface YoYComparison {
  currentYear: number;
  prevYear: number;
  sales: ComparisonData;
  purchases: ComparisonData;
  consultations: ComparisonData;
}

export interface QoQComparison {
  currentQuarter: string;
  prevQuarter: string;
  sales: ComparisonData;
  purchases: ComparisonData;
}

export interface CompanyStats {
  summary: {
    totalSales: number;
    totalPurchases: number;
    totalDocuments: number;
    totalConsultations: number;
    totalContacts: number;
    resignedContacts: number;
    followUpNeeded: number;
    avgSalesPerMonth: number;
    avgPurchasesPerMonth: number;
    avgSalesPerTransaction: number;
    avgPurchasePerTransaction: number;
    conversionRate: number;
    firstTransactionDate: string | null;
    lastTransactionDate: string | null;
    tradingDays: number;
  };
  documentStats: {
    estimate: DocumentStat;
    order: DocumentStat;
    requestQuote: DocumentStat;
  };
  consultationStats: {
    total: number;
    byMethod: Record<string, number>;
    followUpNeeded: number;
  };
  contactStats: {
    active: number;
    resigned: number;
    byDepartment: Record<string, number>;
  };
  yoyComparison: YoYComparison;
  qoqComparison: QoQComparison;
  yearlyData: YearlyData[];
  quarterlyData: QuarterlyData[];
  monthlyData: MonthlyData[];
  topProducts: TopProduct[];
  userActivity: UserActivity[];
  recentDocuments: RecentDocument[];
}

interface UseCompanyStatsParams {
  companyId: string;
}

export function useCompanyStats({ companyId }: UseCompanyStatsParams) {
  const url = companyId ? `/api/companies/${companyId}/stats` : null;

  const { data, error, isLoading, mutate } = useSWR<CompanyStats>(
    url,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    stats: data || null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
