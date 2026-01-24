import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

interface RnDsUpdateData {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  notes?: string;
}

export function useUpdateRnDs() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/manage/rnds`,
    fetcher
  );

  const updateRnds = async (rndsData: RnDsUpdateData) => {
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
