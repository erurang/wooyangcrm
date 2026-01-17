import useSWR from "swr";
import type { PostWithAuthor } from "@/types/post";

interface CompanyPostsResponse {
  posts: PostWithAuthor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const fetcher = async (url: string): Promise<CompanyPostsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch company posts");
  }
  return res.json();
};

/**
 * 회사를 참조(태그)한 게시글 목록 조회 훅
 */
export function useCompanyPosts(companyId: string | undefined, page = 1, limit = 10) {
  const { data, error, isLoading, mutate } = useSWR<CompanyPostsResponse>(
    companyId ? `/api/companies/${companyId}/posts?page=${page}&limit=${limit}` : null,
    fetcher
  );

  return {
    posts: data?.posts || [],
    total: data?.total || 0,
    page: data?.page || 1,
    totalPages: data?.totalPages || 0,
    isLoading,
    isError: !!error,
    refreshPosts: mutate,
  };
}
