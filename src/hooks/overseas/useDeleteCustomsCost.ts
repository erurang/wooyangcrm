import useSWRMutation from "swr/mutation";

async function deleteCustomsCost(
  url: string,
  { arg }: { arg: { id: string } }
) {
  const res = await fetch(`${url}/${arg.id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "통관비용 삭제에 실패했습니다.");
  }

  return res.json();
}

export function useDeleteCustomsCost() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/customs-costs",
    deleteCustomsCost
  );

  return {
    deleteCustomsCost: trigger,
    isDeleting: isMutating,
    error,
  };
}
