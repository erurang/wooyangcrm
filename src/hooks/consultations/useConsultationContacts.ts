import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

interface ConsultationContactsResponse {
  contactsConsultations: unknown[];
}

export function useConsultationContacts(consultationIds: string[]) {
  const { data, error, mutate } = useSWR<ConsultationContactsResponse>(
    consultationIds.length
      ? `/api/consultations/contacts?consultationIds=${consultationIds}`
      : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    contactsConsultations: data?.contactsConsultations || [],
    isLoading: !data && !error,
    isError: !!error,
    refreshContactsConsultations: mutate, // 🔥 추가 (담당자 정보 강제 갱신)
  };
}
