"use client";

import { Search, FileText, Building2, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

interface Document {
  id: string;
  type: "estimate" | "requestQuote" | "order";
  document_number: string;
}

interface Consultation {
  id: string;
  date: string;
  follow_up_date?: string;
  content: string;
  contact_name?: string;
  contact_level?: string;
  companies?: { id: string; name: string };
  users?: { name: string; level: string };
  documents: Document[];
}

interface FollowTableProps {
  consultations: Consultation[] | null;
  isLoading: boolean;
  onDocumentClick: (doc: Document) => void;
}

export default function FollowTable({
  consultations,
  isLoading,
  onDocumentClick,
}: FollowTableProps) {
  const router = useRouter();

  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  if (isLoading) {
    return (
      <div className="px-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-500">후속상담 내역을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!consultations || consultations.length === 0) {
    return (
      <div className="px-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-slate-100 rounded-full mb-4">
              <Search size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">검색 결과가 없습니다</p>
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
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all"
          >
            {/* 카드 본문: 모바일은 세로, 데스크탑은 가로 */}
            <div className="flex flex-col sm:flex-row">
              {/* 좌측 (a): 회사명, 상담기간, 담당자, 상담자 */}
              <div className="sm:w-44 shrink-0 bg-slate-50 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-slate-200 flex flex-col">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:block sm:space-y-3">
                  {/* 회사명 */}
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5 hidden sm:block">거래처</div>
                    <div
                      className="text-sm font-semibold text-orange-600 cursor-pointer hover:text-orange-700 flex items-center gap-1 group"
                      onClick={() => router.push(`/consultations/${consultation.companies?.id}`)}
                    >
                      <Building2 size={14} />
                      <span className="group-hover:underline">{consultation.companies?.name}</span>
                    </div>
                  </div>

                  {/* 상담 기간 */}
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5 hidden sm:block">상담 기간</div>
                    <div className="text-sm font-medium text-slate-800 flex items-center gap-1">
                      {consultation.date}
                      {consultation.follow_up_date && (
                        <span className="text-orange-600 flex items-center gap-0.5">
                          <Calendar size={12} className="hidden sm:inline" />
                          ~{consultation.follow_up_date}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 담당자/상담자 - 데스크탑만 */}
                  <div className="hidden sm:block">
                    <div className="text-xs text-slate-500 mb-0.5">담당자</div>
                    <div className="text-sm text-slate-700">
                      {consultation.contact_name} {consultation.contact_level}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs text-slate-500 mb-0.5">상담자</div>
                    <div className="text-sm text-slate-700">
                      {consultation.users?.name} {consultation.users?.level}
                    </div>
                  </div>
                  {/* 모바일: 담당자/상담자 한 줄 */}
                  <div className="sm:hidden text-xs text-slate-500">
                    {consultation.contact_name} / {consultation.users?.name}
                  </div>
                </div>
              </div>

              {/* 우측 (b): 내용 + 문서 */}
              <div className="flex-1 p-3 sm:p-4 flex flex-col">
                {/* 내용 */}
                <div className="text-sm text-slate-700 leading-relaxed flex-1 overflow-y-auto max-h-24 sm:max-h-32">
                  {formatContentWithLineBreaks(consultation.content)}
                </div>

                {/* 문서 버튼들 (content 아래) */}
                <div className="flex items-center gap-2 flex-wrap mt-3 sm:mt-4 pt-3 border-t border-slate-100">
                  {["estimate", "order", "requestQuote"].map((type) => {
                    const filteredDocs = consultation.documents.filter(
                      (doc) => doc.type === type
                    );
                    if (filteredDocs.length > 0) {
                      return (
                        <div key={type} className="flex items-center gap-1">
                          <span className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs rounded-lg border border-orange-200 bg-orange-50 text-orange-700">
                            <FileText size={14} />
                            <span className="hidden sm:inline">
                              {type === "estimate"
                                ? "견적서"
                                : type === "order"
                                ? "발주서"
                                : "의뢰서"}
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
                                className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-lg cursor-pointer active:bg-orange-100 sm:hover:bg-orange-100 transition-colors"
                              >
                                {doc.document_number}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
