"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useLoginUser } from "@/context/login";
import { usePosts, useCategories, useAddPost, useUpdatePost, useDeletePost } from "@/hooks/posts";
import { uploadPostFile } from "@/lib/postFiles";
import { useDebounce } from "@/hooks/useDebounce";
import PostList from "@/components/board/PostList";
import PostSearchFilter from "@/components/board/PostSearchFilter";
import PostPagination from "@/components/board/PostPagination";
import PostFormModal from "@/components/board/modals/PostFormModal";
import DeletePostModal from "@/components/board/modals/DeletePostModal";
import BoardDashboard from "@/components/board/BoardDashboard";
import type { PostWithAuthor, CreatePostData, UpdatePostData, CreateUserTagData } from "@/types/post";
import { supabase } from "@/lib/supabaseClient";

export default function BoardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useLoginUser();

  // URL 파라미터 값
  const urlPage = Number(searchParams.get("page") || "1");
  const urlCategory = searchParams.get("category") || "";
  const urlSearch = searchParams.get("search") || "";

  // 상태
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [selectedCategoryId, setSelectedCategoryId] = useState(urlCategory);
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [postsPerPage, setPostsPerPage] = useState(20);

  // URL 파라미터 변경 시 상태 동기화
  useEffect(() => {
    setCurrentPage(urlPage);
    setSelectedCategoryId(urlCategory);
    setSearchTerm(urlSearch);
  }, [urlPage, urlCategory, urlSearch]);

  // 모달 상태
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostWithAuthor | null>(null);
  const [deletingPost, setDeletingPost] = useState<PostWithAuthor | null>(null);

  // 디바운스
  const debouncedSearch = useDebounce(searchTerm, 300);

  // 데이터 훅
  const { categories } = useCategories();
  const { posts, total, totalPages, isLoading, mutate } = usePosts({
    category: selectedCategoryId || undefined, // 카테고리 이름으로 필터링
    search: debouncedSearch || undefined,
    page: currentPage,
    limit: postsPerPage,
  });
  const { addPost, isLoading: isAdding } = useAddPost();
  const { updatePost, isLoading: isUpdating } = useUpdatePost();
  const { deletePost, isLoading: isDeleting } = useDeletePost();

  // URL 업데이트
  const updateUrl = (params: { page?: number; category?: string; search?: string }) => {
    const urlParams = new URLSearchParams();
    const page = params.page ?? currentPage;
    const category = params.category ?? selectedCategoryId;
    const search = params.search ?? searchTerm;

    if (page > 1) urlParams.set("page", page.toString());
    if (category) urlParams.set("category", category);
    if (search) urlParams.set("search", search);

    const newUrl = `/board${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;
    router.push(newUrl, { scroll: false });
  };

  // 핸들러
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
    updateUrl({ category: categoryId, page: 1 });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    updateUrl({ search: value, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl({ page });
  };

  const handlePostClick = (post: PostWithAuthor) => {
    router.push(`/board/${post.id}`);
  };

  // 대시보드에서 특정 카테고리로 글쓰기
  const [modalDefaultCategory, setModalDefaultCategory] = useState("");

  const handleNewPost = (categoryName?: string) => {
    setEditingPost(null);
    setModalDefaultCategory(categoryName || selectedCategoryId);
    setIsFormModalOpen(true);
  };

  const handleEditPost = (post: PostWithAuthor) => {
    setEditingPost(post);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (post: PostWithAuthor) => {
    setDeletingPost(post);
    setIsDeleteModalOpen(true);
  };

  // 참조 저장 헬퍼 함수
  const saveReferences = async (postId: string, references: CreatePostData["references"]) => {
    if (!references || references.length === 0) return;

    for (const ref of references) {
      try {
        await fetch("/api/posts/references", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId,
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

  // 기존 참조 삭제 헬퍼 함수
  const clearReferences = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/references?postId=${postId}`);
      const { references } = await response.json();
      for (const ref of references || []) {
        await fetch(`/api/posts/references?id=${ref.id}`, { method: "DELETE" });
      }
    } catch (error) {
      console.error("Failed to clear references:", error);
    }
  };

  // 유저 태그 저장 헬퍼 함수
  const saveUserTags = async (postId: string, tags: CreateUserTagData[]) => {
    if (!tags || tags.length === 0) return;

    for (const tag of tags) {
      try {
        await fetch(`/api/posts/${postId}/tags`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: tag.user_id,
            tag_type: tag.tag_type,
          }),
        });
      } catch (error) {
        console.error("Failed to save user tag:", error);
      }
    }
  };

  // 기존 유저 태그 삭제 헬퍼 함수
  const clearUserTags = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/tags`);
      const { tags } = await response.json();
      for (const tag of tags || []) {
        await fetch(`/api/posts/${postId}/tags?userId=${tag.user_id}`, { method: "DELETE" });
      }
    } catch (error) {
      console.error("Failed to clear user tags:", error);
    }
  };

  const handleFormSubmit = async (data: CreatePostData | UpdatePostData, pendingFiles?: File[], userTags?: CreateUserTagData[]) => {
    console.log("handleFormSubmit called:", { data, pendingFiles, pendingFilesLength: pendingFiles?.length, userTags });
    try {
      if (editingPost) {
        await updatePost({ id: editingPost.id, data: data as UpdatePostData });
        // 수정 시 새 파일 업로드
        if (pendingFiles && pendingFiles.length > 0) {
          console.log("Uploading files for edited post:", editingPost.id);
          for (const file of pendingFiles) {
            const result = await uploadPostFile(file, editingPost.id, user?.id || "");
            console.log("File upload result:", result);
          }
        }
        // 참조 업데이트 (기존 삭제 후 새로 추가)
        if (data.references !== undefined) {
          await clearReferences(editingPost.id);
          await saveReferences(editingPost.id, data.references);
        }
        // 유저 태그 업데이트 (기존 삭제 후 새로 추가)
        if (userTags !== undefined) {
          await clearUserTags(editingPost.id);
          await saveUserTags(editingPost.id, userTags);
        }
        setIsFormModalOpen(false);
        setEditingPost(null);
        mutate();
      } else {
        const newPost = await addPost({ ...data, user_id: user?.id || "" } as CreatePostData);
        console.log("New post created:", newPost);
        // 새 글 작성 시 파일 업로드
        if (newPost?.id && pendingFiles && pendingFiles.length > 0) {
          console.log("Uploading files for new post:", newPost.id, "userId:", user?.id);
          for (const file of pendingFiles) {
            console.log("Uploading file:", file.name);
            const result = await uploadPostFile(file, newPost.id, user?.id || "");
            console.log("File upload result:", result);
          }
        } else {
          console.log("No files to upload or post creation failed:", { postId: newPost?.id, filesCount: pendingFiles?.length });
        }
        // 새 글 작성 시 참조 저장
        if (newPost?.id) {
          await saveReferences(newPost.id, data.references);
        }
        // 새 글 작성 시 유저 태그 저장
        if (newPost?.id && userTags) {
          await saveUserTags(newPost.id, userTags);
        }
        setIsFormModalOpen(false);
        setEditingPost(null);
        // 새 글 작성 후 해당 글 상세 페이지로 이동
        if (newPost?.id) {
          router.push(`/board/${newPost.id}`);
        }
      }
    } catch (error) {
      console.error("Failed to save post:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPost) return;
    try {
      await deletePost({ id: deletingPost.id });
      setIsDeleteModalOpen(false);
      setDeletingPost(null);
      mutate();
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const resetFilters = () => {
    setSelectedCategoryId("");
    setSearchTerm("");
    setCurrentPage(1);
    router.push("/board", { scroll: false });
  };

  // 현재 카테고리명 (헤더 표시용)
  const currentCategoryName = selectedCategoryId || "전체 게시판";

  // 대시보드 뷰 표시 조건: 카테고리 없고 검색어 없을 때
  const showDashboard = !selectedCategoryId && !searchTerm;

  return (
    <div className="min-h-screen bg-slate-50 text-sm text-slate-800">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Plus className="h-5 w-5 text-amber-600" />
              </div>
              <h1 className="text-lg font-bold text-slate-800">{currentCategoryName}</h1>
            </div>
            {!showDashboard && (
              <button
                onClick={() => handleNewPost()}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                글쓰기
              </button>
            )}
          </div>
        </div>
      </div>

      {showDashboard ? (
        // 대시보드 뷰
        <BoardDashboard onNewPost={handleNewPost} />
      ) : (
        // 리스트 뷰
        <>
          {/* 검색/필터 */}
          <PostSearchFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            searchTerm={searchTerm}
            onCategoryChange={handleCategoryChange}
            onSearchChange={handleSearchChange}
            onReset={resetFilters}
          />

          {/* 테이블 컨트롤 */}
          <div className="flex justify-between items-center px-4 py-3">
            <div className="text-sm text-slate-500">
              총 <span className="font-semibold text-amber-600">{total}</span>개 게시글
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">표시:</span>
              <select
                value={postsPerPage}
                onChange={(e) => {
                  setPostsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
              >
                <option value="10">10개</option>
                <option value="20">20개</option>
                <option value="30">30개</option>
                <option value="50">50개</option>
              </select>
            </div>
          </div>

          {/* 게시글 목록 */}
          <PostList
            posts={posts}
            isLoading={isLoading}
            currentUserId={user?.id || ""}
            onPostClick={handlePostClick}
            onEditClick={handleEditPost}
            onDeleteClick={handleDeleteClick}
          />

          {/* 페이지네이션 */}
          {!isLoading && posts.length > 0 && (
            <PostPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* 글쓰기/수정 모달 */}
      <PostFormModal
        isOpen={isFormModalOpen}
        post={editingPost}
        categories={categories}
        defaultCategoryName={modalDefaultCategory}
        userId={user?.id || ""}
        isLoading={isAdding || isUpdating}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingPost(null);
          setModalDefaultCategory("");
        }}
        onSubmit={handleFormSubmit}
      />

      {/* 삭제 확인 모달 */}
      <DeletePostModal
        isOpen={isDeleteModalOpen}
        post={deletingPost}
        isLoading={isDeleting}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingPost(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
