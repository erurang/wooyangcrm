"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  User,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import { OverseasConsultation, OVERSEAS_FILE_TYPE_LABELS } from "@/types/overseas";
import {
  fetchOverseasConsultationFiles,
  OverseasConsultationFileInfo,
} from "@/lib/overseas/overseasConsultationFiles";

interface OverseasConsultationCardProps {
  consultation: OverseasConsultation;
  onEdit?: (consultation: OverseasConsultation) => void;
  onDelete?: (consultation: OverseasConsultation) => void;
}

export default function OverseasConsultationCard({
  consultation,
  onEdit,
  onDelete,
}: OverseasConsultationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [files, setFiles] = useState<OverseasConsultationFileInfo[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [filesLoaded, setFilesLoaded] = useState(false);

  // 확장 시 파일 로드
  useEffect(() => {
    if (isExpanded && !filesLoaded) {
      setLoadingFiles(true);
      fetchOverseasConsultationFiles(consultation.id)
        .then((result) => {
          setFiles(result);
          setFilesLoaded(true);
        })
        .finally(() => setLoadingFiles(false));
    }
  }, [isExpanded, filesLoaded, consultation.id]);

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 파일 다운로드 (cross-origin signed URL 대응)
  const handleDownloadFile = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("파일 다운로드 실패:", error);
      window.open(url, "_blank");
    }
  };

  // 내용 미리보기 (첫 2줄)
  const contentPreview =
    consultation.content.length > 100
      ? consultation.content.slice(0, 100) + "..."
      : consultation.content;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* 날짜 */}
          <div className="flex items-center gap-1.5 text-sm text-slate-600 shrink-0">
            <Calendar size={14} className="text-slate-400" />
            <span>{formatDate(consultation.date)}</span>
          </div>

          {/* 담당자 정보 */}
          <div className="flex items-center gap-3 text-sm">
            {consultation.contact_name && (
              <span className="flex items-center gap-1 text-slate-500">
                <User size={14} className="text-slate-400" />
                {consultation.contact_name}
              </span>
            )}
            {consultation.user_name && (
              <span className="text-teal-600 font-medium">
                {consultation.user_name}
              </span>
            )}
          </div>

          {/* 파일 개수 표시 */}
          {consultation.files && consultation.files.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-600 text-xs rounded-full">
              <FileText size={12} />
              {consultation.files.length}개 파일
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* 수정/삭제 버튼 */}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(consultation);
              }}
              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
              title="수정"
            >
              <Edit2 size={16} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(consultation);
              }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="삭제"
            >
              <Trash2 size={16} />
            </button>
          )}
          {/* 확장 토글 */}
          {isExpanded ? (
            <ChevronUp size={18} className="text-slate-400" />
          ) : (
            <ChevronDown size={18} className="text-slate-400" />
          )}
        </div>
      </div>

      {/* 축소 상태: 내용 미리보기 */}
      {!isExpanded && (
        <div className="px-4 pb-4 -mt-2">
          <p className="text-sm text-slate-600 whitespace-pre-line">
            {contentPreview}
          </p>
        </div>
      )}

      {/* 확장 상태: 전체 내용 + 파일 */}
      {isExpanded && (
        <div className="border-t border-slate-100">
          {/* 전체 내용 */}
          <div className="p-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {consultation.content}
            </p>
          </div>

          {/* 첨부파일 섹션 */}
          <div className="px-4 pb-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                <FileText size={14} />
                첨부파일
              </h4>

              {loadingFiles ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                  <Loader2 size={14} className="animate-spin" />
                  파일 불러오는 중...
                </div>
              ) : files.length > 0 ? (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={16} className="text-slate-400 shrink-0" />
                        <span className="text-xs px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded font-medium">
                          {OVERSEAS_FILE_TYPE_LABELS[file.fileType]}
                        </span>
                        <span className="text-sm text-slate-700 truncate">
                          {file.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(file.url, file.name);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-600 hover:bg-teal-50 rounded transition-colors shrink-0"
                      >
                        <Download size={14} />
                        다운로드
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-1">
                  첨부된 파일이 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
