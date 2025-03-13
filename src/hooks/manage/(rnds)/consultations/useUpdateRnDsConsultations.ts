import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

export function useUpdateRnDsConsultations() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/tests/manage/consultations/update`,
    fetcher
  );

  return {
    updateRndsConsultations: trigger,
    isUpdating: isMutating,
    error,
  };
}
