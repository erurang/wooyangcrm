import useSWR from "swr";

const fetchDocuments = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
};

export interface ReviewFilters {
  type?: string; // estimate, order, requestQuote
  reviewStatus?: string; // expired, canceled, stale (7일 이상 진행중)
  userId?: string;
  companySearch?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export const useDocumentsReview = (filters: ReviewFilters) => {
  const {
    type,
    reviewStatus,
    userId,
    companySearch,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
  } = filters;

  const queryParams = new URLSearchParams();
  queryParams.set("page", page.toString());
  queryParams.set("limit", limit.toString());
  queryParams.set("reviewMode", "true");

  if (type && type !== "all") queryParams.set("type", type);
  if (reviewStatus && reviewStatus !== "all") queryParams.set("reviewStatus", reviewStatus);
  if (userId) queryParams.set("userId", userId);
  if (companySearch) queryParams.set("companySearch", companySearch);
  if (dateFrom) queryParams.set("dateFrom", dateFrom);
  if (dateTo) queryParams.set("dateTo", dateTo);

  const key = `/api/documents/review?${queryParams.toString()}`;

  const { data, error, isLoading, mutate } = useSWR(key, fetchDocuments, {
    revalidateOnFocus: false,
  });

  return {
    documents: data?.documents || [],
    stats: data?.stats || {
      total: 0,
      pending: 0,
      completed: 0,
      expired: 0,
      canceled: 0,
      stale: 0,
    },
    total: data?.total || 0,
    isLoading,
    error,
    refresh: mutate,
  };
};
