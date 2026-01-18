"use client";

import useSWR from "swr";

interface RecentDocument {
  id: string;
  type: string;
  status: string;
  document_number: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  company_id: string;
  company_name: string;
  consultation_id: string;
}

interface RecentDocumentsResponse {
  documents: RecentDocument[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useRecentDocuments(userId: string | undefined, limit: number = 5) {
  const key = userId ? `/api/dashboard/recent-documents?userId=${userId}&limit=${limit}` : null;

  const { data, error, isLoading } = useSWR<RecentDocumentsResponse>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1분간 캐시 유지
  });

  return { documents: data?.documents || [], isLoading, error };
}
