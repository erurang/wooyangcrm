import useSWRMutation from "swr/mutation";
import type { CreatePostData, Post } from "@/types/post";

async function createPost(url: string, { arg }: { arg: CreatePostData }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create post");
  }

  return res.json() as Promise<Post>;
}

export function useAddPost() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/api/posts",
    createPost
  );

  return {
    addPost: trigger,
    isLoading: isMutating,
    error,
  };
}
