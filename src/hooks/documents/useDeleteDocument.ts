import { fetcher } from "@/lib/fetcher";
import useSWRMutation from "swr/mutation";

export function useDeleteDocument() {
  const { trigger, isMutating } = useSWRMutation(
    "/api/tests/documents/type/delete",
    fetcher
  );
  return {
    deleteDocument: trigger,
    isDeleting: isMutating,
  };
}
