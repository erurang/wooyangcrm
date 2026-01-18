"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pin, MessageCircle, Eye, Pencil, Trash2, FileText } from "lucide-react";
import dayjs from "dayjs";
import type { PostWithAuthor } from "@/types/post";

interface PostListProps {
  posts: PostWithAuthor[];
  isLoading: boolean;
  currentUserId: string;
  highlightId?: string | null;
  onPostClick: (post: PostWithAuthor) => void;
  onEditClick?: (post: PostWithAuthor) => void;
  onDeleteClick?: (post: PostWithAuthor) => void;
}

export default function PostList({
  posts,
  isLoading,
  currentUserId,
  highlightId,
  onPostClick,
  onEditClick,
  onDeleteClick,
}: PostListProps) {
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  // 하이라이트된 행으로 스크롤 + 3초 후 제거
  useEffect(() => {
    if (highlightId) {
      setActiveHighlightId(highlightId);
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
      const timer = setTimeout(() => {
        setActiveHighlightId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightId]);
  if (isLoading) {
    return (
      <div className="p-4 pt-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-500">게시글을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="p-4 pt-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="text-center py-20 text-slate-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-600">게시글이 없습니다</p>
            <p className="mt-1 text-slate-400">새 글을 작성해 보세요.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-0">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-24">
                카테고리
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                제목
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-28 hidden md:table-cell">
                작성자
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-28 hidden md:table-cell">
                작성일
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-16 hidden md:table-cell">
                조회
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 w-20">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
          {posts.map((post) => {
            const isHighlighted = activeHighlightId === post.id;
            return (
            <tr
              key={post.id}
              ref={isHighlighted ? highlightRef : null}
              className={`hover:bg-slate-50 transition-all duration-300 ${
                post.is_pinned && !isHighlighted ? "bg-amber-50" : ""
              } ${
                isHighlighted
                  ? "bg-amber-100 ring-2 ring-amber-400 ring-inset animate-pulse"
                  : ""
              }`}
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                  {post.category?.name || "일반"}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onPostClick(post)}
                  className="flex items-center gap-2 text-left hover:text-amber-600 transition-colors"
                >
                  {post.is_pinned && (
                    <Pin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                  <span className="font-medium truncate max-w-md text-slate-800">
                    {post.title}
                  </span>
                  {post.comments_count > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <MessageCircle className="w-3 h-3" />
                      {post.comments_count}
                    </span>
                  )}
                </button>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
                <Link
                  href={`/profile/${post.user_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-amber-600 hover:underline transition-colors"
                >
                  {post.user?.name} {post.user?.level && `${post.user.level}`}
                </Link>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
                {dayjs(post.created_at).format("YYYY-MM-DD")}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 hidden md:table-cell">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.view_count}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right">
                {post.user_id === currentUserId && (onEditClick || onDeleteClick) && (
                  <div className="flex items-center justify-end gap-1">
                    {onEditClick && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditClick(post);
                        }}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {onDeleteClick && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick(post);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
