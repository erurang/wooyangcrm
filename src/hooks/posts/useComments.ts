import useSWR from "swr";
import type { PostComment } from "@/types/post";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
};

export function useComments(postId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<PostComment[]>(
    postId ? `/api/posts/${postId}/comments` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    comments: data || [],
    isLoading,
    error,
    mutate,
  };
}
