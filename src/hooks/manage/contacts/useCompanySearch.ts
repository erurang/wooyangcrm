import useSWR from "swr";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

export function useCompanySearch(searchTerm: string) {
  const { data, error } = useSWR(
    searchTerm
      ? `/api/companies/search?name=${encodeURIComponent(searchTerm)}`
      : null, // ✅ 검색어가 없을 때는 요청하지 않음
    fetcher
  );

  return {
    companies: data?.companies || [], // ✅ 검색어가 없을 때 빈 배열 반환
    isLoading: !data && !error, // ✅ `data`가 없고 `error`도 없을 때 로딩 중 상태 유지
    isError: error,
  };
}
