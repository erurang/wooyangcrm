"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Eye, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useCompanyPosts } from "@/hooks/companies/useCompanyPosts";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface CompanyPostsTabProps {
  companyId: string;
}

export default function CompanyPostsTab({ companyId }: CompanyPostsTabProps) {
  const [page, setPage] = useState(1);

  const { posts, total, totalPages, isLoading } = useCompanyPosts(
    companyId,
    page,
    10
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          이 회사를 태그한 게시글 {total}개
        </span>
      </div>

      {/* 게시글 목록 */}
      {posts.length > 0 ? (
        <div className="bg-white rounded-lg border divide-y">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/board/${post.id}`}
              className="block p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* 카테고리 + 제목 */}
                  <div className="flex items-center gap-2 mb-1">
                    {post.category && (
                      <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                        {post.category.name}
                      </span>
                    )}
                    <h4 className="font-medium text-gray-900 truncate">
                      {post.title}
                    </h4>
                  </div>

                  {/* 내용 미리보기 */}
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {post.content.replace(/<[^>]+>/g, "").slice(0, 150)}
                  </p>

                  {/* 메타 정보 */}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>
                      {post.user?.name} {post.user?.level}
                    </span>
                    <span>{formatDate(post.created_at)}</span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {post.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {post.comments_count}
                    </span>
                  </div>
                </div>

                {/* 고정 글 표시 */}
                {post.is_pinned && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded shrink-0">
                    공지
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">이 회사를 태그한 게시글이 없습니다.</p>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`p-1.5 rounded-md ${
              page === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`p-1.5 rounded-md ${
              page === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
