import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

interface ContactUpdate {
  id?: string;
  contact_name: string;
  mobile?: string;
  department?: string;
  level?: string;
  email?: string;
  resign?: boolean;
  note?: string;
}

export function useUpdateContacts() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/contacts/update`,
    fetcher
  );

  const { mutate } = useSWR(`/api/contacts/list`);

  const updateContacts = async (contact: ContactUpdate[], companyId: string) => {
    try {
      const response = await trigger({
        method: "PUT",
        body: { contact, companyId },
      });

      return response;
    } catch (error) {
      console.error("Error updating company:", error);
      throw error;
    }
  };

  return {
    updateContacts,
    isLoading: isMutating,
    error,
    refetchContacts: mutate,
  };
}
