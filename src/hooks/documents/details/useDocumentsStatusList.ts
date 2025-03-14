import useSWR from "swr";

const fetchDocuments = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
};

export const useDocumentsStatusList = ({
  userId = null, // ✅ 기본값 설정 (userId 없어도 가능)
  type,
  status = "all",
  page,
  docNumber,
  limit,
  companyIds = [], // ✅ 기본값 설정 (빈 배열 허용)
  notes,
}: {
  userId?: string | null;
  type: string;
  status: string;
  page: number;
  limit: number;
  docNumber: string;
  companyIds?: string[];
  notes?: string;
}) => {
  // ✅ URL 동적 생성
  const queryParams = new URLSearchParams({
    type,
    page: page.toString(),
    limit: limit.toString(),
  });

  // ✅ userId가 있을 때만 추가 (없으면 전체 조회)
  if (userId) queryParams.append("userId", userId);

  if (docNumber) queryParams.append("docNumber", docNumber);
  if (status !== "all") {
    queryParams.append("status", status);
  }
  if (notes) queryParams.append("notes", notes);

  // ✅ companyIds가 있을 때만 추가
  companyIds.forEach((id) => queryParams.append("companyIds", id));

  // ✅ userId 없어도 요청 가능
  const key = `/api/tests/documents/status/list?${queryParams.toString()}`;

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
