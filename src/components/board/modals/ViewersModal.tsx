"use client";

import { useState, useEffect } from "react";
import { X, Eye, User } from "lucide-react";
import dayjs from "dayjs";
import type { PostViewer } from "@/types/post";

interface ViewersModalProps {
  isOpen: boolean;
  postId: string;
  onClose: () => void;
}

export default function ViewersModal({
  isOpen,
  postId,
  onClose,
}: ViewersModalProps) {
  const [viewers, setViewers] = useState<PostViewer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      fetchViewers();
    }
  }, [isOpen, postId, page]);

  const fetchViewers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/viewers?page=${page}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setViewers(data.viewers || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch viewers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            조회자 목록
            <span className="text-sm font-normal text-gray-500">({total}명)</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : viewers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>아직 조회자가 없습니다.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {viewers.map((viewer) => (
                <li key={viewer.id} className="py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                    {viewer.user?.name?.charAt(0) || <User className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {viewer.user?.name || "알 수 없음"}
                      {viewer.user?.level && (
                        <span className="ml-1 text-sm text-gray-500">
                          {viewer.user.level}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {dayjs(viewer.viewed_at).format("YYYY-MM-DD HH:mm")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t shrink-0">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}

        {/* 닫기 버튼 */}
        <div className="flex justify-end p-4 border-t shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
