"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pin, Eye, Calendar, User, Pencil, Trash2, Paperclip, Link2 } from "lucide-react";
import dayjs from "dayjs";
import { useLoginUser } from "@/context/login";
import { usePost, useUpdatePost, useDeletePost, useComments, useAddComment } from "@/hooks/posts";
import { useCategories } from "@/hooks/posts";
import CommentList from "@/components/board/comments/CommentList";
import CommentForm from "@/components/board/comments/CommentForm";
import PostFormModal from "@/components/board/modals/PostFormModal";
import DeletePostModal from "@/components/board/modals/DeletePostModal";
import PostFileList from "@/components/board/PostFileList";
import ReferenceDisplay from "@/components/board/ReferenceDisplay";
import { uploadPostFile } from "@/lib/postFiles";
import { uploadCommentFile } from "@/lib/commentFiles";
import type { UpdatePostData, PostReference, CreateReferenceData } from "@/types/post";

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

  // 참조 상태
  const [references, setReferences] = useState<PostReference[]>([]);

  // 참조 로드
  useEffect(() => {
    if (!postId) return;
    const loadReferences = async () => {
      try {
        const response = await fetch(`/api/posts/references?postId=${postId}`);
        if (response.ok) {
          const data = await response.json();
          setReferences(data.references || []);
        }
      } catch (error) {
        console.error("Failed to load references:", error);
      }
    };
    loadReferences();
  }, [postId]);

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

  // 참조 저장/삭제 헬퍼 함수
  const saveReferences = async (targetPostId: string, refs: UpdatePostData["references"]) => {
    if (!refs || refs.length === 0) return;
    for (const ref of refs) {
      try {
        await fetch("/api/posts/references", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId: targetPostId,
            reference_type: ref.reference_type,
            reference_id: ref.reference_id,
            reference_name: ref.reference_name,
          }),
        });
      } catch (error) {
        console.error("Failed to save reference:", error);
      }
    }
  };

  const clearReferences = async (targetPostId: string) => {
    try {
      const response = await fetch(`/api/posts/references?postId=${targetPostId}`);
      const { references: existingRefs } = await response.json();
      for (const ref of existingRefs || []) {
        await fetch(`/api/posts/references?id=${ref.id}`, { method: "DELETE" });
      }
    } catch (error) {
      console.error("Failed to clear references:", error);
    }
  };

  const handleUpdateSubmit = async (data: UpdatePostData, pendingFiles?: File[]) => {
    try {
      await updatePost({ id: postId, data });
      // 새 파일 업로드
      if (pendingFiles && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          await uploadPostFile(file, postId, user?.id || "");
        }
      }
      // 참조 업데이트
      if (data.references !== undefined) {
        await clearReferences(postId);
        await saveReferences(postId, data.references);
        // 참조 다시 로드
        const response = await fetch(`/api/posts/references?postId=${postId}`);
        if (response.ok) {
          const refData = await response.json();
          setReferences(refData.references || []);
        }
      }
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

  // 댓글 참조 저장 헬퍼 함수
  const saveCommentReferences = async (commentId: string, refs: CreateReferenceData[]) => {
    if (!refs || refs.length === 0) return;
    for (const ref of refs) {
      try {
        await fetch("/api/posts/comments/references", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commentId,
            reference_type: ref.reference_type,
            reference_id: ref.reference_id,
            reference_name: ref.reference_name,
          }),
        });
      } catch (error) {
        console.error("Failed to save comment reference:", error);
      }
    }
  };

  const handleCommentSubmit = async (content: string, files?: File[], commentRefs?: CreateReferenceData[]) => {
    if (!user?.id) return;
    try {
      const newComment = await addComment({
        postId,
        data: {
          user_id: user.id,
          content,
        },
      });
      // 파일 업로드
      if (newComment?.id && files && files.length > 0) {
        for (const file of files) {
          await uploadCommentFile(file, newComment.id, user.id);
        }
      }
      // 참조 저장
      if (newComment?.id && commentRefs && commentRefs.length > 0) {
        await saveCommentReferences(newComment.id, commentRefs);
      }
      mutateComments();
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  // 대댓글 제출 (파일 첨부 없음)
  const handleReplySubmit = async (content: string, parentId?: string) => {
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
      console.error("Failed to add reply:", error);
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
    <div className="max-w-6xl mx-auto">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </button>
        {post?.category && (
          <span className="text-sm text-gray-500">
            게시판 &gt; {post.category.name}
          </span>
        )}
      </div>

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
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* 첨부파일 */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
            <Paperclip className="w-4 h-4" />
            첨부파일
          </div>
          <PostFileList postId={postId} />

          {/* 참조 연결 */}
          <ReferenceDisplay references={references} />
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
            onReply={handleReplySubmit}
          />
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-6 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </button>
      </div>

      {/* 수정 모달 */}
      <PostFormModal
        isOpen={isFormModalOpen}
        post={post}
        categories={categories}
        userId={user?.id || ""}
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
