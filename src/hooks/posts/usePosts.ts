import useSWR from "swr";
import type { PostListResponse, PostListFilter } from "@/types/post";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
};

export function usePosts(filter: PostListFilter = {}) {
  const params = new URLSearchParams();

  if (filter.category_id) params.append("category_id", filter.category_id);
  if (filter.search) params.append("search", filter.search);
  if (filter.user_id) params.append("user_id", filter.user_id);
  if (filter.is_pinned !== undefined)
    params.append("is_pinned", String(filter.is_pinned));
  if (filter.page) params.append("offset", String((filter.page - 1) * (filter.limit || 20)));
  if (filter.limit) params.append("limit", String(filter.limit));

  const { data, error, isLoading, mutate } = useSWR<PostListResponse>(
    `/api/posts?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    posts: data?.posts || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 1,
    isLoading,
    error,
    mutate,
  };
}
