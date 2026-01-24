import { useState } from "react";
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
  user_id?: string;
}

export function useUpdateCompany() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateCompany = async (companyData: CompanyUpdateData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { id, ...updateData } = companyData;
      const response = await fetcher(`/api/companies/${id}`, {
        arg: {
          method: "PUT",
          body: updateData,
        },
      });

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Error updating company");
      setError(error);
      console.error("Error updating company:", err);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateCompany,
    isLoading,
    error,
  };
}
