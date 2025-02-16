import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

export function useAddContacts() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/tests/contacts/add`,
    fetcher
  );

  const addContacts = async (contacts: any, companyId: any) => {
    try {
      const response = await trigger({
        method: "POST",
        body: { contacts, companyId },
      });

      if (!response?.contacts) {
        throw new Error("담당자 추가 실패");
      }

      return response.contacts;
    } catch (error) {
      console.error("Error adding company:", error);
      throw error;
    }
  };

  return {
    addContacts,
    isLoading: isMutating,
    error,
  };
}
