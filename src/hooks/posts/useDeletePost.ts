import useSWRMutation from "swr/mutation";

async function deletePost(url: string, { arg }: { arg: { id: string } }) {
  const res = await fetch(`${url}/${arg.id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete post");
  }

  return res.json();
}

export function useDeletePost() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/posts",
    deletePost
  );

  return {
    deletePost: trigger,
    isLoading: isMutating,
    error,
  };
}
