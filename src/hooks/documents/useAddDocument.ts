import { fetcher } from "@/lib/fetcher";
import useSWRMutation from "swr/mutation";

export function useAddDocument() {
  const { trigger, isMutating } = useSWRMutation(
    "/api/tests/documents/type/add",
    fetcher
  );
  return {
    addDocument: trigger,
    isAdding: isMutating,
  };
}
