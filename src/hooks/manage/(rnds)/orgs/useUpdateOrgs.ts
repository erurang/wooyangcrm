import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

export function useUpdateOrgs() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/tests/manage/orgs/update`,
    fetcher
  );

  const updateOrgs = async (orgsData: any) => {
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
