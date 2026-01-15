"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useLoginUser } from "@/context/login";
import { usePosts, useCategories, useAddPost, useUpdatePost, useDeletePost } from "@/hooks/posts";
import { useDebounce } from "@/hooks/useDebounce";
import PostList from "@/components/board/PostList";
import PostSearchFilter from "@/components/board/PostSearchFilter";
import PostPagination from "@/components/board/PostPagination";
import PostFormModal from "@/components/board/modals/PostFormModal";
import DeletePostModal from "@/components/board/modals/DeletePostModal";
import type { PostWithAuthor, CreatePostData, UpdatePostData } from "@/types/post";

export default function BoardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useLoginUser();

  // URL 파라미터에서 초기값 가져오기
  const initialPage = Number(searchParams.get("page") || "1");
  const initialCategory = searchParams.get("category") || "";
  const initialSearch = searchParams.get("search") || "";

  // 상태
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [postsPerPage, setPostsPerPage] = useState(20);

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
    category_id: selectedCategoryId || undefined,
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

  const handleNewPost = () => {
    setEditingPost(null);
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

  const handleFormSubmit = async (data: CreatePostData | UpdatePostData) => {
    try {
      if (editingPost) {
        await updatePost({ id: editingPost.id, data: data as UpdatePostData });
      } else {
        await addPost({ ...data, user_id: user?.id || "" } as CreatePostData);
      }
      setIsFormModalOpen(false);
      setEditingPost(null);
      mutate();
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

  return (
    <div className="text-sm text-[#37352F]">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">게시판</h1>
        <button
          onClick={handleNewPost}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          글쓰기
        </button>
      </div>

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
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          총 <span className="font-semibold">{total}</span>개의 게시글
        </div>
        <div className="flex items-center">
          <label className="mr-2 text-sm text-gray-600">표시 개수:</label>
          <select
            value={postsPerPage}
            onChange={(e) => {
              setPostsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 p-1.5 rounded-md text-sm"
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

      {/* 글쓰기/수정 모달 */}
      <PostFormModal
        isOpen={isFormModalOpen}
        post={editingPost}
        categories={categories}
        isLoading={isAdding || isUpdating}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingPost(null);
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
