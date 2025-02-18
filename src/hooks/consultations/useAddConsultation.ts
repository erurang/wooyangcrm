import { fetcher } from "@/lib/fetcher";
import useSWRMutation from "swr/mutation";

export function useAddConsultation() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/tests/consultations/add",
    fetcher
  );

  return {
    addConsultation: trigger,
    isAdding: isMutating,
    addError: error,
  };
}
