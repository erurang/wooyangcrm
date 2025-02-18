import { fetcher } from "@/lib/fetcher";
import useSWRMutation from "swr/mutation";

export function useUpdateDocument() {
  const { trigger, isMutating } = useSWRMutation(
    "/api/tests/documents/type/update",
    fetcher
  );
  return {
    updateDocument: trigger,
    isUpdating: isMutating,
  };
}
