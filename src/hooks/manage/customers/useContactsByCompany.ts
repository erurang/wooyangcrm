import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface Contact {
  id: string;
  company_id: string;
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
  resign: boolean;
  sort_order: null | number;
}

interface ContactsByCompanyResponse {
  contacts: Contact[];
}

export function useContactsByCompany(companyIds: string[]) {
  const companyIdString = companyIds.length
    ? `?companyIds=${companyIds.join(",")}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<ContactsByCompanyResponse>(
    companyIdString ? `/api/contacts${companyIdString}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }), // 🔹 GET 요청 명시,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    contacts: data?.contacts || [],
    isLoading,
    isError: !!error,
    refreshContacts: mutate,
  };
}
