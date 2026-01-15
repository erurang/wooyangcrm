import { fetcher } from "@/lib/fetcher";
import useSWRMutation from "swr/mutation";

export function useAddRndConsultation() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/manage/consultations/add",
    fetcher
  );

  return {
    addConsultation: trigger,
    isAdding: isMutating,
    addError: error,
  };
}
