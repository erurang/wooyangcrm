import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

interface BRnDsData {
  name: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  notes?: string;
}

export function useAddbRnDs() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/manage/brnds/add`,
    fetcher
  );

  const { mutate } = useSWR(`/api/manage/brnds/list`); // 🔹 SWR의 mutate 가져오기

  const addbRnds = async (rndsData: BRnDsData) => {
    try {
      const response = await trigger({
        method: "POST",
        body: rndsData,
      });

      if (!response?.company) {
        throw new Error("brnds 추가 실패");
      }
      await mutate();

      return response.company;
    } catch (error) {
      console.error("Error adding brnds:", error);
      throw error;
    }
  };

  return {
    addbRnds,
    isLoading: isMutating,
    error,
  };
}
