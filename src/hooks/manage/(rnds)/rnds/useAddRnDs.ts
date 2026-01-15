import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

export function useAddRnDs() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/manage/rnds/add`,
    fetcher
  );

  const { mutate } = useSWR(`/api/manage/rnds/list`); // 🔹 SWR의 mutate 가져오기

  const addRnds = async (rndsData: any) => {
    try {
      const response = await trigger({
        method: "POST",
        body: rndsData,
      });

      if (!response?.rnds) {
        throw new Error("rnds 추가 실패");
      }
      await mutate();

      return response.rnds;
    } catch (error) {
      console.error("Error adding rnds:", error);
      throw error;
    }
  };

  return {
    addRnds,
    isLoading: isMutating,
    error,
  };
}
