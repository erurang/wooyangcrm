import { fetcher } from "@/lib/fetcher";
import useSWRMutation from "swr/mutation";

export function useAddDocument() {
  const { trigger, isMutating } = useSWRMutation(
    "/api/documents/type",
    fetcher
  );
  return {
    addDocument: trigger as (arg: unknown) => Promise<{ document: { id: string } }>,
    isAdding: isMutating,
  };
}
