"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pin, Eye, Calendar, User, Pencil, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import { useLoginUser } from "@/context/login";
import { usePost, useUpdatePost, useDeletePost, useComments, useAddComment } from "@/hooks/posts";
import { useCategories } from "@/hooks/posts";
import CommentList from "@/components/board/comments/CommentList";
import CommentForm from "@/components/board/comments/CommentForm";
import PostFormModal from "@/components/board/modals/PostFormModal";
import DeletePostModal from "@/components/board/modals/DeletePostModal";
import type { UpdatePostData } from "@/types/post";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useLoginUser();
  const postId = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  // 데이터 훅
  const { post, isLoading, mutate: mutatePost } = usePost(postId);
  const { comments, mutate: mutateComments } = useComments(postId);
  const { categories } = useCategories();
  const { updatePost, isLoading: isUpdating } = useUpdatePost();
  const { deletePost, isLoading: isDeleting } = useDeletePost();
  const { addComment, isLoading: isAddingComment } = useAddComment();

  // 모달 상태
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 핸들러
  const handleBack = () => {
    router.push("/board");
  };

  const handleEdit = () => {
    setIsFormModalOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleUpdateSubmit = async (data: UpdatePostData) => {
    try {
      await updatePost({ id: postId, data });
      setIsFormModalOpen(false);
      mutatePost();
    } catch (error) {
      console.error("Failed to update post:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deletePost({ id: postId });
      router.push("/board");
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handleCommentSubmit = async (content: string, parentId?: string) => {
    if (!user?.id) return;
    try {
      await addComment({
        postId,
        data: {
          user_id: user.id,
          content,
          parent_id: parentId,
        },
      });
      mutateComments();
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">게시글을 찾을 수 없습니다.</p>
        <button
          onClick={handleBack}
          className="mt-4 text-blue-600 hover:underline"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const isAuthor = user?.id === post.user_id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* 뒤로가기 */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        목록으로
      </button>

      {/* 게시글 본문 */}
      <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* 카테고리 & 고정 */}
              <div className="flex items-center gap-2 mb-2">
                {post.category && (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                    {post.category.name}
                  </span>
                )}
                {post.is_pinned && (
                  <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                    <Pin className="w-3 h-3" />
                    고정글
                  </span>
                )}
              </div>

              {/* 제목 */}
              <h1 className="text-xl font-semibold text-gray-900">
                {post.title}
              </h1>

              {/* 메타 정보 */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {post.user?.name} {post.user?.level && `${post.user.level}`}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {dayjs(post.created_at).format("YYYY-MM-DD HH:mm")}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  조회 {post.view_count}
                </span>
              </div>
            </div>

            {/* 수정/삭제 버튼 */}
            {isAuthor && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6">
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            {post.content}
          </div>
        </div>
      </article>

      {/* 댓글 섹션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            댓글 ({comments.length})
          </h2>

          {/* 댓글 작성 폼 */}
          <CommentForm
            onSubmit={handleCommentSubmit}
            isLoading={isAddingComment}
          />

          {/* 댓글 목록 */}
          <CommentList
            comments={comments}
            currentUserId={user?.id || ""}
            onReply={handleCommentSubmit}
          />
        </div>
      </div>

      {/* 수정 모달 */}
      <PostFormModal
        isOpen={isFormModalOpen}
        post={post}
        categories={categories}
        isLoading={isUpdating}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleUpdateSubmit}
      />

      {/* 삭제 모달 */}
      <DeletePostModal
        isOpen={isDeleteModalOpen}
        post={post}
        isLoading={isDeleting}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
