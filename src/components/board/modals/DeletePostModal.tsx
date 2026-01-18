"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import type { PostWithAuthor } from "@/types/post";

interface DeletePostModalProps {
  isOpen: boolean;
  post: PostWithAuthor | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function DeletePostModal({
  isOpen,
  post,
  isLoading,
  onClose,
  onConfirm,
}: DeletePostModalProps) {
  const [reason, setReason] = useState("");

  // ESC 키로 모달 닫기
  useEscapeKey(isOpen && !!post, onClose);

  if (!isOpen || !post) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert("삭제 사유를 입력해주세요.");
      return;
    }
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            게시글 삭제 요청
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-4 space-y-4">
          <div>
            <p className="text-gray-700">
              <strong className="text-gray-900">"{post.title}"</strong> 게시글 삭제를
              요청하시겠습니까?
            </p>
            <p className="mt-2 text-sm text-gray-500">
              관리자 승인 후 삭제됩니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              삭제 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="삭제 사유를 입력하세요..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !reason.trim()}
            className="px-4 py-2 text-sm text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "요청 중..." : "삭제 요청"}
          </button>
        </div>
      </div>
    </div>
  );
}
