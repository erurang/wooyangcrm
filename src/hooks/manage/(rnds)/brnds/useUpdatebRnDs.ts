import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

export function useUpdatebRnDs() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/manage/brnds/update`,
    fetcher
  );

  const updatebRnds = async (rndsData: any) => {
    try {
      const response = await trigger({
        method: "PUT",
        body: rndsData,
      });

      return response;
    } catch (error) {
      console.error("Error updating rnds:", error);
      throw error;
    }
  };

  return {
    updatebRnds,
    isLoading: isMutating,
    error,
  };
}
