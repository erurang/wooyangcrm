import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

// 📌 특정 문서에서 사용된 회사 목록 가져오기 훅
export function useCompaniesByDocument(documents: any[]) {
  const companyIds = Array.from(
    new Set(documents?.map((doc) => doc.company_id))
  );

  const { data, error, isLoading, mutate } = useSWR(
    companyIds.length > 0
      ? `/api/companies/byDocument?companyIds=${companyIds.join(",")}`
      : null,
    (url) => fetcher(url, { arg: { method: "GET" } }), // 🔹 GET 요청 명시
    {
      revalidateOnFocus: false, // 포커스 시 자동 갱신 여부
      dedupingInterval: 60000, // 60초 동안 동일한 요청 중복 방지
    }
  );

  return {
    companies: data?.companies || [], // 🔥 companies 배열만 반환
    companiesIsLoading: isLoading,
    companiesIsError: error,
    refreshCompanies: mutate, // 데이터 갱신 함수
  };
}
