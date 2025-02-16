import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useContactsByCompany(companyIds: string[]) {
  const companyIdString = companyIds.length
    ? `?companyIds=${companyIds.join(",")}`
    : null;

  const { data, error, isLoading, mutate } = useSWR(
    companyIdString ? `/api/tests/contacts/list${companyIdString}` : null,
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
