"use client";

import { Search, FileText, Building2, Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";

interface Document {
  id: string;
  type: "estimate" | "requestQuote" | "order";
  document_number: string;
  status?: "pending" | "completed" | "canceled";
}

const getStatusStyle = (status?: string) => {
  switch (status) {
    case "completed":
      return "bg-emerald-500 text-white";
    case "canceled":
      return "bg-slate-400 text-white";
    case "pending":
    default:
      return "bg-amber-500 text-white";
  }
};

const getStatusLabel = (status?: string) => {
  switch (status) {
    case "completed":
      return "완료";
    case "canceled":
      return "취소";
    case "pending":
    default:
      return "진행";
  }
};

interface Consultation {
  id: string;
  date: string;
  created_at?: string;
  title?: string;
  content: string;
  contact_name?: string;
  contact_level?: string;
  companies?: { id: string; name: string };
  users?: { name: string; level: string };
  documents: Document[];
  file_count?: number;
}

interface RecentTableProps {
  consultations: Consultation[] | null;
  isLoading: boolean;
  onDocumentClick: (doc: Document) => void;
  onAttachmentClick?: (consultationId: string, companyId: string) => void;
}

export default function RecentTable({
  consultations,
  isLoading,
  onDocumentClick,
  onAttachmentClick,
}: RecentTableProps) {
  const router = useRouter();

  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  const formatTime = (createdAt?: string) => {
    if (!createdAt) return "";
    const date = new Date(createdAt);
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  if (isLoading) {
    return (
      <div className="px-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-400">상담 내역을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!consultations || consultations.length === 0) {
    return (
      <div className="px-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-slate-50 rounded-2xl mb-4">
              <Search size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-600 font-semibold">검색 결과가 없습니다</p>
            <p className="text-slate-400 text-sm mt-1">다른 검색어로 시도해보세요</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 pb-4">
      <div className="space-y-3">
        {consultations.map((consultation) => (
          <div
            key={consultation.id}
            className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200"
          >
            <div className="flex flex-col sm:flex-row">
              {/* 좌측: 메타 정보 */}
              <div className="sm:w-44 shrink-0 bg-slate-50/80 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-slate-200/60 flex flex-col">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:block sm:space-y-3">
                  {/* 회사명 */}
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5 hidden sm:block">거래처</div>
                    <div
                      className="text-sm font-bold text-sky-600 cursor-pointer hover:text-sky-700 flex items-center gap-1 group"
                      onClick={() => router.push(`/consultations/${consultation.companies?.id}`)}
                    >
                      <Building2 size={14} />
                      <span className="group-hover:underline">{consultation.companies?.name}</span>
                    </div>
                  </div>

                  {/* 날짜 */}
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5 hidden sm:block">상담일</div>
                    <div className="text-sm font-semibold text-slate-800 tabular-nums">
                      {consultation.date}
                      {consultation.created_at && (
                        <span className="ml-1.5 text-xs text-slate-400 font-normal tabular-nums">
                          {formatTime(consultation.created_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 담당자 - 데스크탑만 */}
                  <div className="hidden sm:block">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">담당자</div>
                    <div className="text-sm text-slate-600">
                      {consultation.contact_name} {consultation.contact_level}
                    </div>
                  </div>

                  {/* 상담자 - 데스크탑만 */}
                  <div className="hidden sm:block">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">상담자</div>
                    <div className="text-sm text-slate-600">
                      {consultation.users?.name} {consultation.users?.level}
                    </div>
                  </div>

                  {/* 모바일: 담당자/상담자 한 줄 */}
                  <div className="sm:hidden text-xs text-slate-400">
                    {consultation.contact_name} / {consultation.users?.name}
                  </div>
                </div>
              </div>

              {/* 우측: 내용 + 문서 */}
              <div className="flex-1 p-3 sm:p-4 flex flex-col">
                {consultation.title && (
                  <div className="text-sm font-bold text-slate-800 mb-2 pb-2 border-b border-slate-100">
                    {consultation.title}
                  </div>
                )}
                <div className="text-sm text-slate-600 leading-relaxed flex-1">
                  {formatContentWithLineBreaks(consultation.content)}
                </div>

                {/* 문서 버튼 */}
                <div className="flex items-center gap-2 flex-wrap mt-3 sm:mt-4 pt-3 border-t border-slate-100/80">
                  {["estimate", "order", "requestQuote"].map((type) => {
                    const filteredDocs = consultation.documents.filter(
                      (doc) => doc.type === type
                    );
                    if (filteredDocs.length > 0) {
                      return (
                        <div key={type} className="flex items-center gap-1">
                          <span className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-semibold rounded-lg border border-sky-200/60 bg-sky-50 text-sky-700">
                            <FileText size={13} />
                            <span className="hidden sm:inline">
                              {type === "estimate" ? "견적서" : type === "order" ? "발주서" : "의뢰서"}
                            </span>
                            <span className="sm:hidden">
                              {type === "estimate" ? "견적" : type === "order" ? "발주" : "의뢰"}
                            </span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {filteredDocs.map((doc) => (
                              <span
                                key={doc.id}
                                onClick={() => onDocumentClick(doc)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-sky-50/50 text-sky-700 text-xs font-medium rounded-lg cursor-pointer active:bg-sky-100 sm:hover:bg-sky-100 transition-colors"
                              >
                                {doc.document_number}
                                <span className={`px-1 py-0.5 text-[10px] font-bold rounded-md ${getStatusStyle(doc.status)}`}>
                                  {getStatusLabel(doc.status)}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}

                  {/* 첨부파일 */}
                  {(consultation.file_count ?? 0) > 0 && (
                    <div
                      className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium rounded-lg border border-slate-200/60 bg-white text-slate-500 cursor-pointer active:bg-slate-50 sm:hover:bg-slate-50 sm:hover:border-slate-300 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onAttachmentClick && consultation.companies?.id) {
                          onAttachmentClick(consultation.id, consultation.companies.id);
                        } else if (consultation.companies?.id) {
                          router.push(`/consultations/${consultation.companies.id}?tab=files`);
                        }
                      }}
                    >
                      <Paperclip size={13} />
                      <span className="hidden sm:inline">첨부파일</span>
                      <span className="ml-0.5 bg-slate-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                        {consultation.file_count}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
