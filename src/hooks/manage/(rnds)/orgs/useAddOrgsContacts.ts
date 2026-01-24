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
    `/api/manage/orgs/contacts`,
    fetcher
  );

  const addContacts = async (contacts: OrgContact[], orgId: string) => {
    try {
      const response = await trigger({
        method: "POST",
        body: { contacts, orgId },
      });

      const result = response as { contacts?: unknown } | null;
      return result?.contacts;
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
