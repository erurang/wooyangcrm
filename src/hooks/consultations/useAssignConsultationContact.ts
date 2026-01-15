import { fetcher } from "@/lib/fetcher";
import useSWRMutation from "swr/mutation";

export function useAssignConsultationContact() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/consultations/assign/contact",
    fetcher
  );

  return {
    assignConsultationContact: trigger,
    isAssigning: isMutating,
    assignError: error,
  };
}
