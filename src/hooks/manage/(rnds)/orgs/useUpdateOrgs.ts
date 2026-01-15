import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

interface OrgContact {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  level?: string;
}

interface OrgsUpdateData {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  notes?: string;
  rnds_contacts?: OrgContact[];
}

export function useUpdateOrgs() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/manage/orgs/update`,
    fetcher
  );

  const updateOrgs = async (orgsData: OrgsUpdateData) => {
    try {
      const response = await trigger({
        method: "PUT",
        body: orgsData, // ✅ 담당자 데이터 포함
      });

      return response;
    } catch (error) {
      console.error("Error updating orgs:", error);
      throw error;
    }
  };

  return {
    updateOrgs,
    isLoading: isMutating,
    error,
  };
}
