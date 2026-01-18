import useSWRMutation from "swr/mutation";

interface AddOverseasCompanyData {
  name: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  notes?: string;
  country?: string;
}

async function addOverseasCompany(
  url: string,
  { arg }: { arg: AddOverseasCompanyData }
) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "해외 거래처 추가에 실패했습니다.");
  }

  return res.json();
}

export function useAddOverseasCompany() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/companies/overseas",
    addOverseasCompany
  );

  return {
    addCompany: trigger,
    isAdding: isMutating,
    error,
  };
}
