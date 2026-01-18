import useSWR from "swr";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch consultations");
  return response.json();
};

export function useConsultationsList({
  page,
  limit,
  selectedUser,
  startDate,
  endDate,
  companyIds,
  content,
}: {
  page: number;
  limit: number;
  selectedUser: { id: string } | null;
  startDate: string;
  endDate: string;
  companyIds: string[];
  content?: string; // 상담내용 검색 추가
}) {
  // ✅ URL 동적 생성
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    userId: selectedUser?.id || "",
    startDate: startDate || "",
    endDate: endDate || "",
  });

  // ✅ companyIds가 있을 때만 추가
  companyIds.forEach((id) => queryParams.append("companyIds", id));

  // ✅ content 검색어가 있을 때만 추가
  if (content) {
    queryParams.append("content", content);
  }

  const { data, error, mutate } = useSWR(
    `/api/consultations/recent?${queryParams.toString()}`,
    fetcher
  );

  return {
    consultations: data?.consultations || [],
    totalPages: Math.max(1, Math.ceil((data?.total || 0) / limit)),
    isLoading: !data && !error,
    isError: error,
    mutate, // 파일 개수 갱신용
  };
}
