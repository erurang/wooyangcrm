import useSWR from "swr";

const fetchDocuments = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
};

export const useDocumentsStatusList = (
  userId: string | null,
  type: string,
  status: string,
  searchTerm: string,
  page: number,
  limit: number
) => {
  const shouldFetch = userId !== null;

  const key = shouldFetch
    ? `/api/tests/documents/status/list?userId=${userId}&type=${type}&status=${status}&searchTerm=${searchTerm}&page=${page}&limit=${limit}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetchDocuments, {
    revalidateOnFocus: false,
  });

  // 🔄 최신 데이터를 가져오는 refresh 함수 추가
  const refreshDocuments = async () => {
    await mutate(); // 서버에서 최신 데이터 다시 불러오기
  };

  return {
    documents: data?.documents || [],
    total: data?.total || 0,
    isLoading,
    error,
    mutate,
    refreshDocuments, // 🔄 refresh 기능 추가
  };
};
