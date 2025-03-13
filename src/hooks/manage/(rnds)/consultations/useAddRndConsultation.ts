import { fetcher } from "@/lib/fetcher";
import useSWRMutation from "swr/mutation";

export function useAddRndConsultation() {
  console.log("????????????????????????????????????");
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/tests/manage/consultations/add",
    fetcher
  );

  return {
    addConsultation: trigger,
    isAdding: isMutating,
    addError: error,
  };
}
