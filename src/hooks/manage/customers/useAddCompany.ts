import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

interface CompanyData {
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

export function useAddCompany() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/companies/add`,
    fetcher
  );

  const { mutate } = useSWR(`/api/companies/list`); // 🔹 SWR의 mutate 가져오기

  const addCompany = async (companyData: CompanyData) => {
    try {
      // ✅ 여기서 `{ method, body }` 그대로 전달
      const response = await trigger({
        method: "POST",
        body: companyData,
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
    addCompany,
    isLoading: isMutating,
    error,
  };
}
