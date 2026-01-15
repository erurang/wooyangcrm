import useSWRMutation from "swr/mutation";
import type { CreateCommentData, PostComment } from "@/types/post";

async function createComment(
  url: string,
  { arg }: { arg: { postId: string; data: CreateCommentData } }
) {
  const res = await fetch(`/api/posts/${arg.postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg.data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create comment");
  }

  return res.json() as Promise<PostComment>;
}

export function useAddComment() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/posts/comments",
    createComment
  );

  return {
    addComment: trigger,
    isLoading: isMutating,
    error,
  };
}
