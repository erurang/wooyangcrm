import useSWR from "swr";

interface MonthlySummary {
  month: string;
  estimate: number;
  order: number;
  requestQuote: number;
  total: number;
}

interface CompanySummary {
  company_id: string;
  company_name: string;
  estimate_amount: number;
  order_amount: number;
  estimate_count: number;
  order_count: number;
}

interface TypeStatusSummary {
  type: string;
  pending: number;
  completed: number;
  canceled: number;
  expired: number;
  total: number;
}

interface DocumentCount {
  pending: number;
  completed: number;
  canceled: number;
  expired: number;
  total: number;
}

interface CostSummaryResponse {
  summary: {
    totalSales: number;
    totalPurchase: number;
    totalPending: number;
    profit: number;
  };
  typeStatusSummary: TypeStatusSummary[];
  monthlySummary: MonthlySummary[];
  companySummary: CompanySummary[];
  documentCounts: {
    estimate: DocumentCount;
    order: DocumentCount;
    requestQuote: DocumentCount;
  };
}

interface UseDocumentCostSummaryOptions {
  startDate?: string;
  endDate?: string;
  userId?: string;
  companyId?: string;
}

const fetcher = async (url: string): Promise<CostSummaryResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch cost summary");
  }
  return res.json();
};

export function useDocumentCostSummary({
  startDate,
  endDate,
  userId,
  companyId,
}: UseDocumentCostSummaryOptions = {}) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (userId) params.set("userId", userId);
  if (companyId) params.set("companyId", companyId);

  const queryString = params.toString();
  const url = `/api/documents/costs/summary${queryString ? `?${queryString}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<CostSummaryResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  return {
    summary: data?.summary || { totalSales: 0, totalPurchase: 0, totalPending: 0, profit: 0 },
    typeStatusSummary: data?.typeStatusSummary || [],
    monthlySummary: data?.monthlySummary || [],
    companySummary: data?.companySummary || [],
    documentCounts: data?.documentCounts || {
      estimate: { pending: 0, completed: 0, canceled: 0, expired: 0, total: 0 },
      order: { pending: 0, completed: 0, canceled: 0, expired: 0, total: 0 },
      requestQuote: { pending: 0, completed: 0, canceled: 0, expired: 0, total: 0 },
    },
    isLoading,
    error,
    mutate,
  };
}

export type { MonthlySummary, CompanySummary, TypeStatusSummary, CostSummaryResponse };
