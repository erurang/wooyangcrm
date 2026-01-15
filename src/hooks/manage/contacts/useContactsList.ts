import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useContactsList(
  page: number,
  limit: number,
  contactName: string,
  email: string,
  mobile: string,
  companyName: string,
  resign: string
) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/manage/contacts?page=${page}&limit=${limit}&contact=${contactName}&email=${email}&mobile=${mobile}&company=${companyName}&resign=${resign}`,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    { revalidateOnFocus: false }
  );

  return {
    contacts: data?.contacts || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    refreshContacts: mutate,
  };
}
