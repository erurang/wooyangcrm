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
    <div className="px-4 pb-4">
      <div className="space-y-3">
        {consultations.map((consultation) => (
          <div
            key={consultation.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all"
          >
            {/* 카드 본문: a | b 레이아웃 */}
            <div className="flex">
              {/* 좌측 (a): 회사명, 상담기간, 담당자, 상담자 */}
              <div className="w-44 shrink-0 bg-slate-50 p-4 border-r border-slate-200 flex flex-col">
                <div className="space-y-3">
                  {/* 회사명 */}
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">거래처</div>
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
                    <div className="text-xs text-slate-500 mb-0.5">상담 기간</div>
                    <div className="text-sm font-medium text-slate-800">
                      {consultation.date}
                    </div>
                    {consultation.follow_up_date && (
                      <div className="text-sm font-medium text-orange-600 flex items-center gap-1 mt-0.5">
                        <Calendar size={12} />
                        ~{consultation.follow_up_date}
                      </div>
                    )}
                  </div>

                  {/* 담당자 */}
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">담당자</div>
                    <div className="text-sm text-slate-700">
                      {consultation.contact_name} {consultation.contact_level}
                    </div>
                  </div>

                  {/* 상담자 */}
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5">상담자</div>
                    <div className="text-sm text-slate-700">
                      {consultation.users?.name} {consultation.users?.level}
                    </div>
                  </div>
                </div>
              </div>

              {/* 우측 (b): 내용 + 문서 */}
              <div className="flex-1 p-4 flex flex-col">
                {/* 내용 */}
                <div className="text-sm text-slate-700 leading-relaxed flex-1 overflow-y-auto max-h-32">
                  {formatContentWithLineBreaks(consultation.content)}
                </div>

                {/* 문서 버튼들 (content 아래) */}
                <div className="flex items-center gap-2 flex-wrap mt-4 pt-3 border-t border-slate-100">
                  {["estimate", "order", "requestQuote"].map((type) => {
                    const filteredDocs = consultation.documents.filter(
                      (doc) => doc.type === type
                    );
                    if (filteredDocs.length > 0) {
                      return (
                        <div key={type} className="flex items-center gap-1">
                          <span className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-orange-200 bg-orange-50 text-orange-700">
                            <FileText size={14} />
                            {type === "estimate"
                              ? "견적서"
                              : type === "order"
                              ? "발주서"
                              : "의뢰서"}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {filteredDocs.map((doc) => (
                              <span
                                key={doc.id}
                                onClick={() => onDocumentClick(doc)}
                                className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
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
