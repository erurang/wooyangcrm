"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, User, MessageSquare, AtSign, Tag, Calendar, Eye } from "lucide-react";
import dayjs from "dayjs";
import { useLoginUser } from "@/context/login";
import { useGlobalToast } from "@/context/toast";
import { usePosts, useCategories, useAddPost, useUpdatePost, useDeletePost } from "@/hooks/posts";
import { uploadPostFile } from "@/lib/postFiles";
import { useDebounce } from "@/hooks/useDebounce";
import PostList from "@/components/board/PostList";
import Pagination from "@/components/ui/Pagination";
import PostFormModal from "@/components/board/modals/PostFormModal";
import DeletePostModal from "@/components/board/modals/DeletePostModal";
import type { PostWithAuthor, CreatePostData, UpdatePostData, CreateUserTagData } from "@/types/post";
import { highlightMentions } from "@/components/board/comments/CommentForm";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

// 탭 타입
type TabType = "my" | "tagged" | "mentioned";

// 태그된 게시글 타입
interface TaggedPost extends PostWithAuthor {
  tag_type: "reference" | "coauthor";
  tagged_at: string;
}

// 멘션된 댓글 타입
interface MentionedComment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  user_id: string;
  user: { id: string; name: string; level?: string };
  post: { id: string; title: string };
}

export default function MyPostsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useLoginUser();
  const { success, error: showError } = useGlobalToast();

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get("tab") as TabType) || "my"
  );

  // URL 파라미터 값
  const urlPage = Number(searchParams.get("page") || "1");
  const urlSearch = searchParams.get("search") || "";
  const highlightId = searchParams.get("highlight");

  // 상태
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [postsPerPage, setPostsPerPage] = useState(20);

  // 태그된 글 / 멘션된 댓글 상태
  const [taggedPosts, setTaggedPosts] = useState<TaggedPost[]>([]);
  const [taggedTotal, setTaggedTotal] = useState(0);
  const [taggedTotalPages, setTaggedTotalPages] = useState(0);
  const [taggedLoading, setTaggedLoading] = useState(false);

  const [mentionedComments, setMentionedComments] = useState<MentionedComment[]>([]);
  const [mentionedTotal, setMentionedTotal] = useState(0);
  const [mentionedTotalPages, setMentionedTotalPages] = useState(0);
  const [mentionedLoading, setMentionedLoading] = useState(false);

  // URL 파라미터 변경 시 상태 동기화
  useEffect(() => {
    setCurrentPage(urlPage);
    setSearchTerm(urlSearch);
    const tab = searchParams.get("tab") as TabType;
    if (tab) setActiveTab(tab);
  }, [urlPage, urlSearch, searchParams]);

  // 모달 상태
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostWithAuthor | null>(null);
  const [deletingPost, setDeletingPost] = useState<PostWithAuthor | null>(null);

  // 디바운스
  const debouncedSearch = useDebounce(searchTerm, 300);

  // 데이터 훅 - 현재 사용자의 글만 필터링
  const { categories } = useCategories();
  const { posts, total, totalPages, isLoading, mutate } = usePosts({
    user_id: user?.id || undefined,
    search: debouncedSearch || undefined,
    page: currentPage,
    limit: postsPerPage,
  });
  const { addPost, isLoading: isAdding } = useAddPost();
  const { updatePost, isLoading: isUpdating } = useUpdatePost();
  const { deletePost, isLoading: isDeleting } = useDeletePost();

  // 태그된 글 로드
  useEffect(() => {
    if (!user?.id || activeTab !== "tagged") return;

    const loadTaggedPosts = async () => {
      setTaggedLoading(true);
      try {
        const response = await fetch(
          `/api/users/${user.id}/tagged-posts?page=${currentPage}&limit=${postsPerPage}`
        );
        if (response.ok) {
          const data = await response.json();
          setTaggedPosts(data.posts || []);
          setTaggedTotal(data.total || 0);
          setTaggedTotalPages(data.totalPages || 0);
        }
      } catch (error) {
        console.error("Failed to load tagged posts:", error);
      } finally {
        setTaggedLoading(false);
      }
    };
    loadTaggedPosts();
  }, [user?.id, activeTab, currentPage, postsPerPage]);

  // 멘션된 댓글 로드
  useEffect(() => {
    if (!user?.id || activeTab !== "mentioned") return;

    const loadMentionedComments = async () => {
      setMentionedLoading(true);
      try {
        const response = await fetch(
          `/api/users/${user.id}/mentioned-comments?page=${currentPage}&limit=${postsPerPage}`
        );
        if (response.ok) {
          const data = await response.json();
          setMentionedComments(data.comments || []);
          setMentionedTotal(data.total || 0);
          setMentionedTotalPages(data.totalPages || 0);
        }
      } catch (error) {
        console.error("Failed to load mentioned comments:", error);
      } finally {
        setMentionedLoading(false);
      }
    };
    loadMentionedComments();
  }, [user?.id, activeTab, currentPage, postsPerPage]);

  // URL 업데이트 - /my/posts로 변경
  const updateUrl = (params: { page?: number; search?: string; tab?: TabType }) => {
    const urlParams = new URLSearchParams();
    const page = params.page ?? currentPage;
    const search = params.search ?? searchTerm;
    const tab = params.tab ?? activeTab;

    if (tab !== "my") urlParams.set("tab", tab);
    if (page > 1) urlParams.set("page", page.toString());
    if (search) urlParams.set("search", search);

    const newUrl = `/profile/posts${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;
    router.push(newUrl, { scroll: false });
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm("");
    updateUrl({ tab, page: 1, search: "" });
  };

  // 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
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
    try {
      if (editingPost) {
        await updatePost({ id: editingPost.id, data: data as UpdatePostData });
        // 수정 시 새 파일 업로드
        if (pendingFiles && pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            await uploadPostFile(file, editingPost.id, user?.id || "");
          }
        }
        // 참조 업데이트
        if (data.references !== undefined) {
          await clearReferences(editingPost.id);
          await saveReferences(editingPost.id, data.references);
        }
        // 유저 태그 업데이트
        if (userTags !== undefined) {
          await clearUserTags(editingPost.id);
          await saveUserTags(editingPost.id, userTags);
        }
        setIsFormModalOpen(false);
        setEditingPost(null);
        mutate();
      } else {
        const newPost = await addPost({ ...data, user_id: user?.id || "" } as CreatePostData);
        // 새 글 작성 시 파일 업로드
        if (newPost?.id && pendingFiles && pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            await uploadPostFile(file, newPost.id, user?.id || "");
          }
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

  const handleDeleteConfirm = async (reason: string) => {
    if (!deletingPost || !user?.id) return;
    try {
      // 삭제 요청 생성
      const { error } = await supabase.from("deletion_requests").insert({
        user_id: user.id,
        type: "posts",
        related_id: deletingPost.id,
        content: { posts: deletingPost.title },
        delete_reason: reason,
      });

      if (error) {
        console.error("Failed to create delete request:", error);
        showError("삭제 요청에 실패했습니다.");
        return;
      }

      success("삭제 요청이 완료되었습니다. 관리자의 승인을 기다려주세요.");
      setIsDeleteModalOpen(false);
      setDeletingPost(null);
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  // 로그인 필요
  if (!user?.id) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center text-slate-400">
          <FileText className="w-12 h-12 mb-4" />
          <p>로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  // 현재 탭에 따른 데이터
  const currentTotal = activeTab === "my" ? total : activeTab === "tagged" ? taggedTotal : mentionedTotal;
  const currentTotalPages = activeTab === "my" ? totalPages : activeTab === "tagged" ? taggedTotalPages : mentionedTotalPages;
  const currentLoading = activeTab === "my" ? isLoading : activeTab === "tagged" ? taggedLoading : mentionedLoading;

  return (
    <div className="text-sm">
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">내 게시글</h1>
            <p className="text-sm text-slate-500 mt-1">내 게시판 활동을 확인하세요.</p>
          </div>
          <button
            onClick={handleNewPost}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            글쓰기
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-1 mt-4 pt-4 border-t border-slate-100">
          <button
            onClick={() => handleTabChange("my")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "my"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            내 글
            {total > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === "my" ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                {total}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("tagged")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "tagged"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Tag className="w-4 h-4" />
            태그된 글
            {taggedTotal > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === "tagged" ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                {taggedTotal}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("mentioned")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === "mentioned"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <AtSign className="w-4 h-4" />
            멘션된 댓글
            {mentionedTotal > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === "mentioned" ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                {mentionedTotal}
              </span>
            )}
          </button>
        </div>

        {/* 검색 (내 글 탭에서만) */}
        {activeTab === "my" && (
          <div className="mt-4">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="제목 또는 내용으로 검색..."
              className="w-full max-w-md border border-slate-200 rounded-lg px-4 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        {/* 테이블 컨트롤 */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-slate-600">
            총 <span className="font-bold text-blue-600">{currentTotal}</span>개
          </div>
          <div className="flex items-center">
            <label className="mr-2 text-sm text-slate-600">표시 개수:</label>
            <select
              value={postsPerPage}
              onChange={(e) => {
                setPostsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 p-1.5 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="10">10개</option>
              <option value="20">20개</option>
              <option value="30">30개</option>
              <option value="50">50개</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* 내 글 탭 */}
      {activeTab === "my" && (
        <>
          <PostList
            posts={posts}
            isLoading={isLoading}
            currentUserId={user?.id || ""}
            highlightId={highlightId}
            onPostClick={handlePostClick}
            onEditClick={handleEditPost}
            onDeleteClick={handleDeleteClick}
          />

          {!isLoading && posts.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
              <div className="flex flex-col items-center justify-center text-slate-400">
                <FileText className="w-12 h-12 mb-4" />
                <p className="mb-4">작성한 게시글이 없습니다.</p>
                <button
                  onClick={handleNewPost}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  첫 글 작성하기
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 태그된 글 탭 */}
      {activeTab === "tagged" && (
        <>
          {taggedLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 mt-3">태그된 글을 불러오는 중...</p>
              </div>
            </div>
          ) : taggedPosts.length > 0 ? (
            <div className="space-y-3">
              {taggedPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    href={`/board/${post.id}`}
                    className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {post.category && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                            {post.category.name}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          post.tag_type === "coauthor"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {post.tag_type === "coauthor" ? "공동작성" : "참조"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-800 truncate">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                          <User className="w-3 h-3" />
                          {post.user?.name}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                          <Calendar className="w-3 h-3" />
                          {dayjs(post.created_at).format("YYYY-MM-DD")}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                          <Eye className="w-3 h-3" />
                          {post.view_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
              <div className="flex flex-col items-center justify-center text-slate-400">
                <Tag className="w-12 h-12 mb-4" />
                <p>태그된 게시글이 없습니다.</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* 멘션된 댓글 탭 */}
      {activeTab === "mentioned" && (
        <>
          {mentionedLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 mt-3">멘션된 댓글을 불러오는 중...</p>
              </div>
            </div>
          ) : mentionedComments.length > 0 ? (
            <div className="space-y-3">
              {mentionedComments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    href={`/board/${comment.post_id}?commentId=${comment.id}`}
                    className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">
                          {comment.user?.name}
                        </span>
                        님이 멘션함
                        <span>·</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                          {dayjs(comment.created_at).format("YYYY-MM-DD HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2">
                        {highlightMentions(comment.content)}
                      </p>
                      <div className="mt-2 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg inline-block">
                        <span className="font-medium text-slate-600">게시글:</span>{" "}
                        {comment.post?.title}
                      </div>
                    </div>
                  </div>
                </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
              <div className="flex flex-col items-center justify-center text-slate-400">
                <AtSign className="w-12 h-12 mb-4" />
                <p>멘션된 댓글이 없습니다.</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* 페이지네이션 */}
      {!currentLoading && currentTotalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={currentTotalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* 글쓰기/수정 모달 */}
      <PostFormModal
        isOpen={isFormModalOpen}
        post={editingPost}
        categories={categories}
        userId={user?.id || ""}
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
