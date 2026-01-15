import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

interface CompanyUpdateData {
  id: string;
  name: string;
  business_number?: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  notes?: string;
  parcel?: string;
  industry?: string[];
}

export function useUpdateCompany() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/companies/update`,
    fetcher
  );

  const updateCompany = async (companyData: CompanyUpdateData) => {
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
