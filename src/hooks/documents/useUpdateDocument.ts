import { fetcher } from "@/lib/fetcher";
import useSWRMutation from "swr/mutation";

export function useUpdateDocument() {
  const { trigger, isMutating } = useSWRMutation(
    "/api/documents/type",
    fetcher
  );
  return {
    updateDocument: trigger,
    isUpdating: isMutating,
  };
}
