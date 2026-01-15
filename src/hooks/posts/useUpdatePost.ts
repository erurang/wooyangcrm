import useSWRMutation from "swr/mutation";
import type { UpdatePostData, Post } from "@/types/post";

async function updatePost(
  url: string,
  { arg }: { arg: { id: string; data: UpdatePostData } }
) {
  const res = await fetch(`${url}/${arg.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg.data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update post");
  }

  return res.json() as Promise<Post>;
}

export function useUpdatePost() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/posts",
    updatePost
  );

  return {
    updatePost: trigger,
    isLoading: isMutating,
    error,
  };
}
