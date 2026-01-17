import useSWR from "swr";
import type { PostWithAuthor, PostFile } from "@/types/post";

interface PostDetail extends PostWithAuthor {
  files: PostFile[];
  consultation?: {
    id: string;
    company_id: string;
    date: string;
    content: string;
  } | null;
  document?: {
    id: string;
    document_number: string;
    type: string;
    status: string;
  } | null;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch post");
  return res.json();
};

export function usePost(postId: string | null, userId?: string | null) {
  const url = postId
    ? userId
      ? `/api/posts/${postId}?userId=${userId}`
      : `/api/posts/${postId}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<PostDetail>(
    url,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    post: data ?? null,
    isLoading,
    error,
    mutate,
  };
}
