import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

export function useUpdateRnDsConsultations() {
  const { trigger, isMutating, error } = useSWRMutation(
    `/api/manage/consultations/update`,
    fetcher
  );

  return {
    updateRndsConsultations: trigger,
    isUpdating: isMutating,
    error,
  };
}
