"use client";

import { Pin, MessageCircle, Eye, Pencil, Trash2, FileText } from "lucide-react";
import dayjs from "dayjs";
import type { PostWithAuthor } from "@/types/post";

interface PostListProps {
  posts: PostWithAuthor[];
  isLoading: boolean;
  currentUserId: string;
  onPostClick: (post: PostWithAuthor) => void;
  onEditClick: (post: PostWithAuthor) => void;
  onDeleteClick: (post: PostWithAuthor) => void;
}

export default function PostList({
  posts,
  isLoading,
  currentUserId,
  onPostClick,
  onEditClick,
  onDeleteClick,
}: PostListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="text-center p-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium">게시글이 없습니다</p>
          <p className="mt-1">새 글을 작성해 보세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
              카테고리
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              제목
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 hidden md:table-cell">
              작성자
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 hidden md:table-cell">
              작성일
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16 hidden md:table-cell">
              조회
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
              관리
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {posts.map((post) => (
            <tr
              key={post.id}
              className={`hover:bg-gray-50 transition-colors ${
                post.is_pinned ? "bg-yellow-50" : ""
              }`}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                  {post.category?.name || "일반"}
                </span>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onPostClick(post)}
                  className="flex items-center gap-2 text-left hover:text-blue-600 transition-colors"
                >
                  {post.is_pinned && (
                    <Pin className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  )}
                  <span className="font-medium truncate max-w-md">
                    {post.title}
                  </span>
                  {post.comments_count > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MessageCircle className="w-3 h-3" />
                      {post.comments_count}
                    </span>
                  )}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                {post.user?.name} {post.user?.level && `${post.user.level}`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                {dayjs(post.created_at).format("YYYY-MM-DD")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.view_count}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                {post.user_id === currentUserId && (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(post);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="수정"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(post);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
