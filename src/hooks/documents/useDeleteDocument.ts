import { fetcher } from "@/lib/fetcher";
import useSWRMutation from "swr/mutation";

export function useDeleteDocument() {
  const { trigger, isMutating } = useSWRMutation(
    "/api/documents/type/delete",
    fetcher
  );
  return {
    deleteDocument: trigger,
    isDeleting: isMutating,
  };
}
