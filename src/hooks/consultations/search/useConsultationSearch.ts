import useSWR from "swr";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch consultations");
  return response.json();
};

export function useConsultationSearch({
  page,
  limit,
  selectedUser,
  startDate,
  endDate,
  content,
}: {
  page: number;
  limit: number;
  selectedUser: { id: string } | null;
  startDate: string;
  endDate: string;
  content: string;
}) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    userId: selectedUser?.id || "",
    startDate: startDate || "",
    endDate: endDate || "",
    content: content || "",
  });

  const { data, error } = useSWR(
    `/api/consultations/search?${queryParams.toString()}`,
    fetcher
  );

  return {
    consultations: data?.consultations || [],
    totalPages: Math.max(1, Math.ceil((data?.total || 0) / limit)),
    isLoading: !data && !error,
    isError: error,
  };
}
