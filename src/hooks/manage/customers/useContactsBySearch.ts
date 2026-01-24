import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface ContactsBySearchResponse {
  companyIds: string[];
}

export function useContactsBySearch(contactTerm: string) {
  const { data, error, isLoading, mutate } = useSWR<ContactsBySearchResponse>(
    contactTerm ? `/api/contacts?contactTerm=${contactTerm}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    companyIds: data?.companyIds || [],
    isLoading,
    isError: !!error,
    refreshContacts: mutate,
  };
}
