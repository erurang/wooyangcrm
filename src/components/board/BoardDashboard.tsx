"use client";

import Link from "next/link";
import useSWR from "swr";
import { Plus, ChevronRight, MessageSquare, Eye, Pin } from "lucide-react";
import type { PostCategory, PostWithAuthor } from "@/types/post";

interface CategoriesResponse {
  categories: PostCategory[];
}

interface PostsResponse {
  posts: PostWithAuthor[];
  total: number;
}

interface BoardDashboardProps {
  onNewPost: (categoryName?: string) => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BoardDashboard({ onNewPost }: BoardDashboardProps) {
  // 카테고리 목록
  const { data: catData, isLoading: catLoading } = useSWR<CategoriesResponse>(
    "/api/posts/categories",
    fetcher,
    { revalidateOnFocus: false }
  );

  const categories = catData?.categories || [];

  // 각 카테고리별 최근 게시글
  const categoryKeys = categories.map((c) => c.name).join(",");
  const { data: postsData, isLoading: postsLoading } = useSWR<Record<string, PostsResponse>>(
    categories.length > 0 ? `board-dashboard-posts-${categoryKeys}` : null,
    async () => {
      const results: Record<string, PostsResponse> = {};
      await Promise.all(
        categories.map(async (category) => {
          const res = await fetch(`/api/posts?category=${encodeURIComponent(category.name)}&limit=5`);
          const data = await res.json();
          results[category.name] = { posts: data.posts || [], total: data.total || 0 };
        })
      );
      return results;
    },
    { revalidateOnFocus: false }
  );

  const isLoading = catLoading || postsLoading;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                <div className="h-4 bg-slate-100 rounded w-4/6"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categories.map((category) => {
          const categoryPosts = postsData?.[category.name];
          const posts = categoryPosts?.posts || [];
          const total = categoryPosts?.total || 0;

          return (
            <div
              key={category.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* 카테고리 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <Link
                  href={`/board?category=${encodeURIComponent(category.name)}`}
                  className="flex items-center gap-2 font-medium text-slate-800 hover:text-amber-600"
                >
                  {category.name}
                  <span className="text-xs text-slate-500 font-normal">({total})</span>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNewPost(category.name)}
                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="글쓰기"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/board?category=${encodeURIComponent(category.name)}`}
                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="더보기"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* 게시글 목록 */}
              <div className="divide-y divide-slate-100">
                {posts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-400 text-sm">
                    게시글이 없습니다
                  </div>
                ) : (
                  posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/board/${post.id}`}
                      className="block px-4 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        {post.is_pinned && (
                          <Pin className="w-3 h-3 text-amber-500 flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 truncate">{post.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                            <span>{post.user?.name}</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            <span className="flex items-center gap-0.5">
                              <Eye className="w-3 h-3" />
                              {post.view_count}
                            </span>
                            {post.comments_count > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-600">
                                <MessageSquare className="w-3 h-3" />
                                {post.comments_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
