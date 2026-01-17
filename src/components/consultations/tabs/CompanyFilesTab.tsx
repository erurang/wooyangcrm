"use client";

import { useState } from "react";
import { FileText, Download, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useCompanyFiles, type CompanyFile } from "@/hooks/companies/useCompanyFiles";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface CompanyFilesTabProps {
  companyId: string;
}

export default function CompanyFilesTab({ companyId }: CompanyFilesTabProps) {
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<"all" | "consultation" | "post">("all");

  const { files, total, totalPages, isLoading } = useCompanyFiles(
    companyId,
    page,
    20,
    filterType
  );

  const getSourceTypeLabel = (type: string) => {
    switch (type) {
      case "consultation":
        return "상담";
      case "post":
        return "게시글";
      case "comment":
        return "댓글";
      default:
        return type;
    }
  };

  const getSourceTypeBadgeColor = (type: string) => {
    switch (type) {
      case "consultation":
        return "bg-blue-100 text-blue-700";
      case "post":
        return "bg-green-100 text-green-700";
      case "comment":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getSourceLink = (file: CompanyFile) => {
    switch (file.source_type) {
      case "consultation":
        return `/consultations/${companyId}?highlight=${file.source_id}`;
      case "post":
        return `/board/${file.source_id}`;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">필터:</span>
        <div className="flex gap-1">
          {[
            { value: "all", label: "전체" },
            { value: "consultation", label: "상담" },
            { value: "post", label: "게시글" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setFilterType(option.value as "all" | "consultation" | "post");
                setPage(1);
              }}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterType === option.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm text-gray-500">
          총 {total}개의 파일
        </span>
      </div>

      {/* 파일 목록 */}
      {files.length > 0 ? (
        <div className="bg-white rounded-lg border divide-y">
          {files.map((file) => {
            const sourceLink = getSourceLink(file);
            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span
                        className={`px-1.5 py-0.5 rounded ${getSourceTypeBadgeColor(
                          file.source_type
                        )}`}
                      >
                        {getSourceTypeLabel(file.source_type)}
                      </span>
                      {file.source_title && (
                        <span className="truncate">{file.source_title}</span>
                      )}
                      <span>• {formatDate(file.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {sourceLink && (
                    <a
                      href={sourceLink}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="원본 보기"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  {file.signed_url && (
                    <a
                      href={file.signed_url}
                      download={file.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="다운로드"
                    >
                      <Download size={16} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">연관된 파일이 없습니다.</p>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`p-1.5 rounded-md ${
              page === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`p-1.5 rounded-md ${
              page === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
