import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

export function useAddOrgs() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/tests/manage/orgs/add`,
    fetcher
  );

  const { mutate } = useSWR(`/api/tests/manage/orgs/list/page`); // 🔹 SWR의 mutate 가져오기

  const addOrgs = async (orgsData: any) => {
    try {
      const response = await trigger({
        method: "POST",
        body: orgsData,
      });

      if (!response?.orgs) {
        throw new Error("orgs 추가 실패");
      }
      await mutate();

      return response.orgs;
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
