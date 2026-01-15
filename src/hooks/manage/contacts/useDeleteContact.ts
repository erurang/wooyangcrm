import useSWRMutation from "swr/mutation";

const deleteContactFetcher = async (url: string, { arg }: { arg: string }) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contactId: arg }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete contact");
  }

  return res.json();
};

export function useDeleteContact() {
  const { trigger, isMutating } = useSWRMutation(
    "/api/contacts/delete",
    deleteContactFetcher
  );

  return { deleteContact: trigger, isDeleting: isMutating };
}
