"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileText, MessageSquare, Calendar, Eye } from "lucide-react";
import dayjs from "dayjs";
import useSWR from "swr";
import { useLoginUser } from "@/context/login";
import { usePosts } from "@/hooks/posts";
import PostList from "@/components/board/PostList";
import PostPagination from "@/components/board/PostPagination";
import type { PostWithAuthor } from "@/types/post";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserComment {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  post_id: string;
  post?: {
    id: string;
    title: string;
  };
}

type TabType = "posts" | "comments";

export default function UserPostsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useLoginUser();
  const targetUserId = typeof params.userId === "string" ? params.userId : params.userId?.[0] ?? "";
  const basePath = `/profile/${targetUserId}`;

  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [postsPage, setPostsPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);

  // 유저 통계 조회
  const { data: statsData, isLoading: statsLoading } = useSWR(
    targetUserId ? `/api/users/${targetUserId}/board-stats` : null,
    fetcher
  );

  // 유저 게시글 조회
  const { posts, total: postsTotal, totalPages: postsTotalPages, isLoading: postsLoading } = usePosts({
    user_id: targetUserId,
    page: postsPage,
    limit: 10,
  });

  // 유저 댓글 조회
  const { data: commentsData, isLoading: commentsLoading } = useSWR(
    targetUserId && activeTab === "comments"
      ? `/api/users/${targetUserId}/comments?page=${commentsPage}&limit=10`
      : null,
    fetcher
  );

  const handlePostClick = (post: PostWithAuthor) => {
    router.push(`/board/${post.id}`);
  };

  if (!targetUserId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">유저를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const stats = statsData?.stats;
  const comments: UserComment[] = commentsData?.comments || [];
  const commentsTotalPages = commentsData?.totalPages || 1;

  return (
    <div className="text-sm text-[#37352F]">
      {/* 탭 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "posts"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          게시글 ({stats?.posts_count || 0})
        </button>
        <button
          onClick={() => setActiveTab("comments")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "comments"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          댓글 ({stats?.comments_count || 0})
        </button>
      </div>

      {/* 게시글 탭 */}
      {activeTab === "posts" && (
        <div>
          {postsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
            </div>
          ) : posts.length > 0 ? (
            <>
              <PostList
                posts={posts}
                isLoading={false}
                currentUserId={currentUser?.id || ""}
                onPostClick={handlePostClick}
              />
              {postsTotalPages > 1 && (
                <PostPagination
                  currentPage={postsPage}
                  totalPages={postsTotalPages}
                  onPageChange={setPostsPage}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>작성한 게시글이 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 댓글 탭 */}
      {activeTab === "comments" && (
        <div>
          {commentsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
            </div>
          ) : comments.length > 0 ? (
            <>
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    {/* 게시글 링크 */}
                    {comment.post && (
                      <Link
                        href={`/board/${comment.post.id}`}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 mb-2"
                      >
                        <FileText className="w-3 h-3" />
                        <span className="truncate">{comment.post.title}</span>
                      </Link>
                    )}
                    {/* 댓글 내용 */}
                    <p className="text-gray-700 whitespace-pre-wrap line-clamp-3">
                      {comment.content}
                    </p>
                    {/* 날짜 */}
                    <div className="mt-2 text-xs text-gray-400">
                      {dayjs(comment.created_at).format("YYYY-MM-DD HH:mm")}
                      {comment.updated_at && comment.updated_at !== comment.created_at && (
                        <span className="ml-2">(수정됨)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {commentsTotalPages > 1 && (
                <PostPagination
                  currentPage={commentsPage}
                  totalPages={commentsTotalPages}
                  onPageChange={setCommentsPage}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>작성한 댓글이 없습니다.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
