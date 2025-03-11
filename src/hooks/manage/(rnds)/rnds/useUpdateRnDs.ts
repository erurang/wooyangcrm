import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

export function useUpdateRnDs() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/tests/manage/rnds/update`,
    fetcher
  );

  const updateRnds = async (rndsData: any) => {
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
    updateRnds,
    isLoading: isMutating,
    error,
  };
}
