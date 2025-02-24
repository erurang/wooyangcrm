import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useContactsByCompany } from "./useContactsByCompany";

export function useCompaniesList(
  page: number,
  limit: number,
  searchTerm: string,
  addressTerm: string,
  contactCompanyIds: string[]
) {
  const companyIdString = contactCompanyIds?.length
    ? `&companyIds=${contactCompanyIds.join(",")}`
    : "";

  const { data, error, isLoading, mutate } = useSWR(
    `/api/tests/companies/list?page=${page}&limit=${limit}&name=${searchTerm}&address=${addressTerm}${companyIdString}`,
    (url) => fetcher(url, { arg: { method: "GET" } }), // 🔹 GET 요청 명시

    {
      revalidateOnFocus: false,
    }
  );

  // 🔹 1️⃣ 가져온 companies 리스트에서 ID 추출
  const companyIds = data?.companies?.map((company: any) => company.id) || [];

  // 🔹 2️⃣ `useContactsByCompany`를 사용하여 해당 company들의 contact 정보 가져오기
  const { contacts, isLoading: contactsLoading } =
    useContactsByCompany(companyIds);

  // 🔹 3️⃣ contacts를 company_id 기준으로 그룹화
  const contactsByCompany = companyIds.reduce(
    (acc: Record<string, any[]>, companyId: any) => {
      acc[companyId] = contacts.filter(
        (contact: any) => contact.company_id === companyId
      );
      return acc;
    },
    {}
  );

  // 🔹 4️⃣ contacts 데이터를 companies 리스트와 병합
  const formattedCompanies =
    data?.companies?.map((company: any) => ({
      ...company,
      contact: contactsByCompany[company.id] || [], // 🚀 `contacts`가 없으면 빈 배열 설정
    })) || [];

  return {
    companies: formattedCompanies,
    total: data?.total || 0,
    isLoading: isLoading || contactsLoading,
    isError: !!error,
    refreshCompanies: mutate,
  };
}
