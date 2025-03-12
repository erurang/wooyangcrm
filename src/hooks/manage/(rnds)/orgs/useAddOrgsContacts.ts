import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

export function useAddOrgsContacts() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/tests/manage/orgs/contacts/add`,
    fetcher
  );

  const addContacts = async (contacts: any, orgId: any) => {
    try {
      const response = await trigger({
        method: "POST",
        body: { contacts, orgId },
      });

      return response.contacts;
    } catch (error) {
      console.error("Error adding orgs contacts:", error);
      throw error;
    }
  };

  return {
    addContacts,
    isLoading: isMutating,
    error,
  };
}
