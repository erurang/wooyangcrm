import { fetcher } from "@/lib/fetcher";
import useSWRMutation from "swr/mutation";

export function useAddConsultation() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/consultations",
    fetcher
  );

  return {
    addConsultation: trigger as (arg: unknown) => Promise<{ consultation_id: string }>,
    isAdding: isMutating,
    addError: error,
  };
}
