import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

export function useAddRnDs() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/tests/manage/rnds/add`,
    fetcher
  );

  const { mutate } = useSWR(`/api/tests/manage/rnds/list`); // 🔹 SWR의 mutate 가져오기

  const addRnds = async (rndsData: any) => {
    try {
      const response = await trigger({
        method: "POST",
        body: rndsData,
      });

      if (!response?.company) {
        throw new Error("거래처 추가 실패");
      }
      await mutate();

      return response.company;
    } catch (error) {
      console.error("Error adding company:", error);
      throw error;
    }
  };

  return {
    addRnds,
    isLoading: isMutating,
    error,
  };
}
