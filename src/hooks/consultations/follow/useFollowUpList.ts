import useSWR from "swr";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch consultations");
  return response.json();
};

export function useFollowUpList({
  page,
  limit,

  selectedUser,
  startDate,
  endDate,
  companyIds,
}: {
  page: number;
  limit: number;

  selectedUser: { id: string } | null;
  startDate: string;
  endDate: string;
  companyIds: string[];
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

  const { data, error } = useSWR(
    `/api/tests/consultations/follow?${queryParams.toString()}`,
    fetcher
  );

  return {
    consultations: data?.consultations || [],
    totalPages: Math.max(1, Math.ceil((data?.total || 0) / limit)),
    isLoading: !data && !error,
    isError: error,
  };
}
