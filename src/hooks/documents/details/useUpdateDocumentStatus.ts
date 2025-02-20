import useSWRMutation from "swr/mutation";

const updateDocumentStatus = async (
  url: string,
  { arg }: { arg: { id: string; status: string; status_reason: object } }
) => {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    throw new Error("Failed to update document status");
  }

  return res.json();
};

export const useUpdateDocumentStatus = () => {
  return useSWRMutation(
    "/api/tests/documents/status/update",
    updateDocumentStatus
  );
};
