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
    `/api/manage/brnds`,
    fetcher
  );

  const { mutate } = useSWR(`/api/manage/brnds`); // 🔹 SWR의 mutate 가져오기

  const addbRnds = async (rndsData: BRnDsData) => {
    try {
      const response = await trigger({
        method: "POST",
        body: rndsData,
      });

      const result = response as { company?: unknown } | null;
      if (!result?.company) {
        throw new Error("brnds 추가 실패");
      }
      await mutate();

      return result.company;
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
