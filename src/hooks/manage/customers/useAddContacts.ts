import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";
import type { ContactFormData } from "@/types";

interface NewContact {
  contact_name: string;
  mobile?: string;
  department?: string;
  level?: string;
  email?: string;
  resign?: boolean;
  note?: string;
}

export function useAddContacts() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/contacts/add`,
    fetcher
  );

  const addContacts = async (contacts: NewContact[], companyId: string) => {
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
      console.error("Error adding contacts:", error);
      throw error;
    }
  };

  return {
    addContacts,
    isLoading: isMutating,
    error,
  };
}
