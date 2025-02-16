import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

export function useUpdateContacts() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/tests/contacts/update`,
    fetcher
  );

  const { mutate } = useSWR(`/api/tests/contacts/list`);

  const updateContacts = async (contact: any, companyId: any) => {
    try {
      const response = await trigger({
        method: "PUT",
        body: { contact, companyId },
      });

      await mutate(`/api/tests/contacts/list?companyIds=${[companyId]}`, true);

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
  };
}
