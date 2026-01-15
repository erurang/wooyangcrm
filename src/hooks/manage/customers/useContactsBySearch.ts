import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useContactsBySearch(contactTerm: string) {
  const { data, error, isLoading, mutate } = useSWR(
    contactTerm ? `/api/contacts/list?contactTerm=${contactTerm}` : null,
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
