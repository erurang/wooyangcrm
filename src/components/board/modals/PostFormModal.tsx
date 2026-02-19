"use client";

import { useState, useEffect, useRef } from "react";
import { X, Paperclip, Upload, FileText, Loader2, Link2, Users, Folder } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import TiptapEditor from "@/components/board/TiptapEditor";
import ReferenceSelector from "@/components/board/ReferenceSelector";
import UserTagSelector from "@/components/board/UserTagSelector";
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import { uploadPostFile, fetchPostFiles, deletePostFile } from "@/lib/postFiles";
import type { PostWithAuthor, PostCategory, CreatePostData, UpdatePostData, CreateReferenceData, PostReference, CreateUserTagData, PostUserTag } from "@/types/post";

interface PostFile {
  id: string;
  name: string;
  url: string;
  filePath: string;
  user_id: string;
}

interface PostFormModalProps {
  isOpen: boolean;
  post: PostWithAuthor | null;
  categories: PostCategory[];
  defaultCategoryName?: string;
  userId: string;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePostData | UpdatePostData, pendingFiles?: File[], userTags?: CreateUserTagData[]) => void;
}

export default function PostFormModal({
  isOpen,
  post,
  categories,
  defaultCategoryName,
  userId,
  isLoading,
  onClose,
  onSubmit,
}: PostFormModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  // 파일 관련 상태
  const [existingFiles, setExistingFiles] = useState<PostFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 참조 관련 상태
  const [references, setReferences] = useState<CreateReferenceData[]>([]);

  // 유저 태그 관련 상태
  const [userTags, setUserTags] = useState<CreateUserTagData[]>([]);

  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  // 모달이 열릴 때만 초기화 (categories 변경 시 리셋 방지)
  useEffect(() => {
    if (!isOpen) return;

    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setCategoryId(post.category_id || "");
      setIsPinned(post.is_pinned);
      // 기존 파일 로드
      loadExistingFiles(post.id);
      // 기존 참조 로드
      loadExistingReferences(post.id);
      // 기존 유저 태그 로드
      loadExistingUserTags(post.id);
    } else {
      setTitle("");
      setContent("");
      setIsPinned(false);
      setExistingFiles([]);
      setReferences([]);
      setUserTags([]);
    }
    setPendingFiles([]);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id, isOpen]);

  // 카테고리 기본값 설정 (새 글 작성 시)
  useEffect(() => {
    if (!isOpen || post) return;

    const defaultCategory = defaultCategoryName
      ? categories.find((c) => c.name === defaultCategoryName)
      : null;
    if (defaultCategory) {
      setCategoryId(defaultCategory.id);
    }
  }, [isOpen, post, defaultCategoryName, categories]);

  const loadExistingFiles = async (postId: string) => {
    const files = await fetchPostFiles(postId);
    setExistingFiles(files);
  };

  const loadExistingReferences = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/references?postId=${postId}`);
      if (response.ok) {
        const data = await response.json();
        const refs: CreateReferenceData[] = (data.references || []).map((r: PostReference) => ({
          reference_type: r.reference_type,
          reference_id: r.reference_id,
          reference_name: r.reference_name,
        }));
        setReferences(refs);
      }
    } catch (error) {
      console.error("Failed to load references:", error);
    }
  };

  const loadExistingUserTags = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/tags`);
      if (response.ok) {
        const data = await response.json();
        const tags: CreateUserTagData[] = (data.tags || []).map((t: PostUserTag) => ({
          user_id: t.user_id,
          tag_type: t.tag_type,
        }));
        setUserTags(tags);
      }
    } catch (error) {
      console.error("Failed to load user tags:", error);
    }
  };

  const handleAddReference = (ref: CreateReferenceData) => {
    setReferences((prev) => [...prev, ref]);
  };

  const handleRemoveReference = (index: number) => {
    setReferences((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddUserTag = (tag: CreateUserTagData) => {
    setUserTags((prev) => [...prev, tag]);
  };

  const handleRemoveUserTag = (userId: string) => {
    setUserTags((prev) => prev.filter((t) => t.user_id !== userId));
  };

  // 파일 아이콘 반환
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
      return "🖼️";
    } else if (["pdf"].includes(ext || "")) {
      return "📄";
    } else if (["doc", "docx"].includes(ext || "")) {
      return "📝";
    } else if (["xls", "xlsx"].includes(ext || "")) {
      return "📊";
    } else if (["ppt", "pptx"].includes(ext || "")) {
      return "📽️";
    } else if (["zip", "rar", "7z"].includes(ext || "")) {
      return "🗜️";
    }
    return "📎";
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      console.log("[FileUpload] Dropped files:", filesArray.map(f => f.name));
      setPendingFiles(prev => [...prev, ...filesArray]);
    }
  };

  // 파일 선택
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("[FileUpload] handleFileSelect triggered, files:", e.target.files?.length);
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      console.log("[FileUpload] Adding files:", filesArray.map(f => f.name));
      setPendingFiles(prev => [...prev, ...filesArray]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 대기 파일 삭제
  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 기존 파일 삭제
  const handleDeleteExistingFile = async (fileId: string, filePath: string) => {
    setDeletingFile(fileId);
    const success = await deletePostFile(fileId, filePath);
    if (success) {
      setExistingFiles(prev => prev.filter(f => f.id !== fileId));
    }
    setDeletingFile(null);
  };

  const validate = () => {
    const newErrors: { title?: string; content?: string } = {};
    if (!title.trim()) {
      newErrors.title = "제목을 입력해주세요.";
    }
    if (!content.trim()) {
      newErrors.content = "내용을 입력해주세요.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      title: title.trim(),
      content: content.trim(),
      category_id: categoryId || undefined,
      is_pinned: isPinned,
      references: references.length > 0 ? references : undefined,
    };

    console.log("PostFormModal handleSubmit:", { pendingFilesCount: pendingFiles.length, pendingFiles, references, userTags });
    onSubmit(
      data,
      pendingFiles.length > 0 ? pendingFiles : undefined,
      userTags.length > 0 ? userTags : undefined
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-[70vw] max-h-[85vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {post ? "게시글 수정" : "새 게시글 작성"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              카테고리
            </label>
            <HeadlessSelect
              value={categoryId}
              onChange={(value) => setCategoryId(value)}
              options={[
                { value: "", label: "선택 안함" },
                ...categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
              placeholder="선택 안함"
              icon={<Folder className="h-4 w-4" />}
            />
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.title ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="제목을 입력하세요"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              내용 <span className="text-red-500">*</span>
            </label>
            <div className={errors.content ? "ring-1 ring-red-500 rounded-md" : ""}>
              <TiptapEditor
                content={content}
                onChange={setContent}
                placeholder="내용을 입력하세요..."
              />
            </div>
            {errors.content && (
              <p className="mt-1 text-xs text-red-500">{errors.content}</p>
            )}
          </div>

          {/* 고정글 체크박스 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
            />
            <label htmlFor="isPinned" className="text-sm text-slate-600">
              상단 고정
            </label>
          </div>

          {/* 파일 첨부 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              <Paperclip className="w-4 h-4 inline mr-1" />
              첨부파일
            </label>

            {/* 기존 파일 목록 (수정 시) */}
            {existingFiles.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {existingFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-md"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-sky-600 hover:underline truncate"
                      >
                        {file.name}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteExistingFile(file.id, file.filePath)}
                      disabled={deletingFile === file.id}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      {deletingFile === file.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 대기 파일 목록 */}
            {pendingFiles.length > 0 && (
              <div className="mb-3 space-y-2">
                {pendingFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2.5 sm:p-2 bg-sky-50 border border-sky-200 rounded-lg"
                  >
                    <span className="text-lg">{getFileIcon(file.name)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-600 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePendingFile(index)}
                      className="p-2 sm:p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 드래그 앤 드롭 영역 */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all active:bg-slate-100 ${
                isDragging
                  ? "border-sky-500 bg-sky-50"
                  : "border-slate-300 hover:border-sky-400 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              {isDragging ? (
                <div className="flex flex-col items-center gap-2 text-sky-600">
                  <Upload className="h-8 w-8" />
                  <p className="text-sm font-medium">파일을 여기에 놓으세요</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 sm:gap-2 text-slate-400">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
                  <p className="text-sm">
                    <span className="font-medium text-sky-600">파일 선택</span>
                    <span className="hidden sm:inline"> 또는 드래그 앤 드롭</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 참조 연결 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              <Link2 className="w-4 h-4 inline mr-1" />
              참조 연결
            </label>
            <p className="text-xs text-slate-400 mb-2">
              관련 거래처, 상담, 문서를 연결할 수 있습니다
            </p>
            <ReferenceSelector
              selectedReferences={references}
              onAdd={handleAddReference}
              onRemove={handleRemoveReference}
            />
          </div>

          {/* 유저 태그 (참조/공동작성) */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              유저 태그
            </label>
            <p className="text-xs text-slate-400 mb-2">
              이 게시글에 참조하거나 공동작성한 유저를 태그할 수 있습니다
            </p>
            <UserTagSelector
              selectedTags={userTags}
              onAdd={handleAddUserTag}
              onRemove={handleRemoveUserTag}
              excludeUserId={userId}
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "저장 중..." : post ? "수정" : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
