import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("데이터를 불러오는 중 오류가 발생했습니다.");
  const result = await res.json();
  return result.data;
};

// ✅ SWR 훅
export function useContactDetails(
  contactId: string,
  startDate: string,
  endDate: string
) {
  const { data, error, isLoading } = useSWR(
    contactId
      ? `/api/manage/contacts/detail?contactId=${contactId}&startDate=${startDate}&endDate=${endDate}`
      : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  return {
    contactData: data,
    isLoading,
    error,
  };
}
