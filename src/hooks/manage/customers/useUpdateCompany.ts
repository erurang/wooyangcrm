import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

export function useUpdateCompany() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/companies/update`,
    fetcher
  );

  const updateCompany = async (companyData: any) => {
    try {
      const response = await trigger({
        method: "PUT",
        body: companyData,
      });

      return response;
    } catch (error) {
      console.error("Error updating company:", error);
      throw error;
    }
  };

  return {
    updateCompany,
    isLoading: isMutating,
    error,
  };
}
