import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

export function useUpdateConsultation() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/consultations/update",
    fetcher
  );

  return {
    updateConsultation: trigger,
    isUpdating: isMutating,
    updateError: error,
  };
}
