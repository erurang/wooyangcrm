import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface RnDsOrgs {
  id: string;
  name: string;
  address: string;
  notes: string;
  phone: string;
  fax: string;
  email: string;
  rnds_contacts?: {
    id?: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    level: string;
  }[];
}

interface OrgsListResponse {
  data: RnDsOrgs[];
  total: number;
}

export function useOrgsList(page: number, limit: number, searchTerm: string) {
  const { data, error, isLoading, mutate } = useSWR<OrgsListResponse>(
    `/api/manage/orgs?page=${page}&limit=${limit}&name=${searchTerm}`,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    orgs: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError: !!error,
    refreshOrgs: mutate,
  };
}
