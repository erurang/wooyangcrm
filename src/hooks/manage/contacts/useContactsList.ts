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
  note?: string;
  companies?: {
    name: string;
  };
}

interface ContactsListResponse {
  contacts: Contact[];
  total: number;
}

export function useContactsList(
  page: number,
  limit: number,
  contactName: string,
  email: string,
  mobile: string,
  companyName: string,
  resign: string
) {
  const { data, error, isLoading, mutate } = useSWR<ContactsListResponse>(
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
