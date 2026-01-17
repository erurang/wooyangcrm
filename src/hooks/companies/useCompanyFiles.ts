import useSWR from "swr";

export interface CompanyFile {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  source_type: "consultation" | "post" | "comment";
  source_id: string;
  source_title?: string;
  signed_url?: string;
}

interface CompanyFilesResponse {
  files: CompanyFile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const fetcher = async (url: string): Promise<CompanyFilesResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch company files");
  }
  return res.json();
};

/**
 * 회사와 연관된 모든 파일 조회 훅
 * @param companyId 회사 ID
 * @param page 페이지 번호
 * @param limit 페이지당 항목 수
 * @param type 파일 타입 필터 (all, consultation, post)
 */
export function useCompanyFiles(
  companyId: string | undefined,
  page = 1,
  limit = 20,
  type: "all" | "consultation" | "post" = "all"
) {
  const { data, error, isLoading, mutate } = useSWR<CompanyFilesResponse>(
    companyId
      ? `/api/companies/${companyId}/files?page=${page}&limit=${limit}&type=${type}`
      : null,
    fetcher
  );

  return {
    files: data?.files || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 0,
    isLoading,
    isError: !!error,
    refreshFiles: mutate,
  };
}
