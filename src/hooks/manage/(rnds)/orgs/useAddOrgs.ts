import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

interface OrgsData {
  name: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  notes?: string;
}

export function useAddOrgs() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/manage/orgs`,
    fetcher
  );

  const { mutate } = useSWR(`/api/manage/orgs`); // 🔹 SWR의 mutate 가져오기

  const addOrgs = async (orgsData: OrgsData) => {
    try {
      const response = await trigger({
        method: "POST",
        body: orgsData,
      });

      const result = response as { orgs?: { id: string; name: string } } | null;
      if (!result?.orgs) {
        throw new Error("orgs 추가 실패");
      }
      await mutate();

      return result.orgs;
    } catch (error) {
      console.error("Error adding orgs:", error);
      throw error;
    }
  };

  return {
    addOrgs,
    isLoading: isMutating,
    error,
  };
}
