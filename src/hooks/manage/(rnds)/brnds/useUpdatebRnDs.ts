import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

interface BRnDsUpdateData {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  notes?: string;
}

export function useUpdatebRnDs() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/manage/brnds`,
    fetcher
  );

  const updatebRnds = async (rndsData: BRnDsUpdateData) => {
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
