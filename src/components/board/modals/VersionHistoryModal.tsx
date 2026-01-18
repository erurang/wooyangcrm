"use client";

import { useState, useEffect } from "react";
import { X, History, User, ChevronRight, FileText } from "lucide-react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import dayjs from "dayjs";
import type { PostVersion } from "@/types/post";

interface VersionHistoryModalProps {
  isOpen: boolean;
  postId: string;
  currentTitle: string;
  onClose: () => void;
}

export default function VersionHistoryModal({
  isOpen,
  postId,
  currentTitle,
  onClose,
}: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<PostVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PostVersion | null>(null);

  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      fetchVersions();
      setSelectedVersion(null);
    }
  }, [isOpen, postId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVersionDetail = async (versionId: string) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetch(`/api/posts/${postId}/versions/${versionId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedVersion(data);
      }
    } catch (error) {
      console.error("Failed to fetch version detail:", error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            버전 기록
            <span className="text-sm font-normal text-gray-500 truncate max-w-xs">
              - {currentTitle}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 왼쪽: 버전 목록 */}
          <div className="w-1/3 border-r overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 px-4">
                <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>수정 이력이 없습니다.</p>
                <p className="text-xs mt-1">게시글이 수정되면 이전 버전이 여기에 저장됩니다.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {versions.map((version) => (
                  <li key={version.id}>
                    <button
                      onClick={() => fetchVersionDetail(version.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                        selectedVersion?.id === version.id ? "bg-purple-50" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                            v{version.version_number}
                          </span>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {version.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span>{version.user?.name || "알 수 없음"}</span>
                          <span className="mx-1">·</span>
                          <span>{dayjs(version.edited_at).format("MM-DD HH:mm")}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 오른쪽: 버전 상세 */}
          <div className="w-2/3 overflow-y-auto">
            {isLoadingDetail ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500" />
              </div>
            ) : selectedVersion ? (
              <div className="p-4">
                {/* 버전 정보 */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                  <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                    버전 {selectedVersion.version_number}
                  </span>
                  <span className="text-sm text-gray-500">
                    {selectedVersion.user?.name}님이{" "}
                    {dayjs(selectedVersion.edited_at).format("YYYY-MM-DD HH:mm")}에 수정
                  </span>
                </div>

                {/* 제목 */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    제목
                  </h4>
                  <p className="text-gray-900 font-medium">{selectedVersion.title}</p>
                </div>

                {/* 내용 */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    내용
                  </h4>
                  <div
                    className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-md p-4"
                    dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <p>버전을 선택하면 내용이 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>

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
