"use client";

import { AlertTriangle, X } from "lucide-react";
import type { PostWithAuthor } from "@/types/post";

interface DeletePostModalProps {
  isOpen: boolean;
  post: PostWithAuthor | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeletePostModal({
  isOpen,
  post,
  isLoading,
  onClose,
  onConfirm,
}: DeletePostModalProps) {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            게시글 삭제
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-4">
          <p className="text-gray-700">
            <strong className="text-gray-900">"{post.title}"</strong> 게시글을
            삭제하시겠습니까?
          </p>
          <p className="mt-2 text-sm text-gray-500">
            이 작업은 되돌릴 수 없으며, 관련된 댓글과 첨부파일도 함께 삭제됩니다.
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}
