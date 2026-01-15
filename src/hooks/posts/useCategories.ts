import useSWR from "swr";
import type { PostCategory } from "@/types/post";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
};

export function useCategories() {
  const { data, error, isLoading } = useSWR<PostCategory[]>(
    "/api/posts/categories",
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    categories: data || [],
    isLoading,
    error,
  };
}
