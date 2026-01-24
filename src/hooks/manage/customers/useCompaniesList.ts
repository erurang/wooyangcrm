import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useContactsByCompany } from "./useContactsByCompany";

interface CompanyBase {
  id: string;
  company_code: string;
  name: string;
  business_number: string;
  address: string;
  industry: string[];
  phone: string;
  fax: string;
  email: string;
  notes: string;
  parcel: string;
}

interface ContactBase {
  id: string;
  company_id: string;
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
  resign: boolean;
}

interface CompanyWithContacts extends CompanyBase {
  contact: ContactBase[];
}

interface CompaniesListResponse {
  companies: CompanyBase[];
  total: number;
}

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

  const { data, error, isLoading, mutate } = useSWR<CompaniesListResponse>(
    `/api/companies?page=${page}&limit=${limit}&name=${searchTerm}&address=${addressTerm}${companyIdString}`,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
    }
  );

  // 🔹 1️⃣ 가져온 companies 리스트에서 ID 추출
  const companyIds = data?.companies?.map((company: CompanyBase) => company.id) || [];

  // 🔹 2️⃣ `useContactsByCompany`를 사용하여 해당 company들의 contact 정보 가져오기
  const { contacts, isLoading: contactsLoading } =
    useContactsByCompany(companyIds);

  // 🔹 3️⃣ contacts를 company_id 기준으로 그룹화
  const contactsByCompany = companyIds.reduce(
    (acc: Record<string, ContactBase[]>, companyId: string) => {
      acc[companyId] = contacts.filter(
        (contact: ContactBase) => contact.company_id === companyId
      );
      return acc;
    },
    {} as Record<string, ContactBase[]>
  );

  // 🔹 4️⃣ contacts 데이터를 companies 리스트와 병합
  const formattedCompanies: CompanyWithContacts[] =
    data?.companies?.map((company: CompanyBase) => ({
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
