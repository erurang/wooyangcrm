import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

interface OrgContact {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  level?: string;
}

export function useAddOrgsContacts() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/manage/orgs/contacts/add`,
    fetcher
  );

  const addContacts = async (contacts: OrgContact[], orgId: string) => {
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
