"use client";

import { Search, FileText, Building2, Paperclip } from "lucide-react";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";

interface Document {
  id: string;
  type: "estimate" | "requestQuote" | "order";
  document_number: string;
}

interface Consultation {
  id: string;
  date: string;
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
}

export default function RecentTable({
  consultations,
  isLoading,
  onDocumentClick,
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="flex justify-center items-center py-20">
          <CircularProgress size={40} />
        </div>
      </div>
    );
  }

  if (!consultations || consultations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="flex flex-col items-center justify-center py-16">
          <Search size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
          <p className="text-gray-400 text-sm mt-2">다른 검색어로 시도해보세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="space-y-4">
        {consultations.map((consultation) => (
          <div
            key={consultation.id}
            className="bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-all"
          >
            {/* 카드 본문: a | b 레이아웃 */}
            <div className="flex">
              {/* 좌측 (a): 회사명, 날짜, 담당자, 상담자 */}
              <div className="w-44 shrink-0 bg-gray-50 p-4 border-r flex flex-col">
                <div className="space-y-3">
                  {/* 회사명 */}
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">거래처</div>
                    <div
                      className="text-sm font-semibold text-blue-600 cursor-pointer hover:text-blue-800 hover:underline flex items-center gap-1"
                      onClick={() => router.push(`/consultations/${consultation.companies?.id}`)}
                    >
                      <Building2 size={14} />
                      {consultation.companies?.name}
                    </div>
                  </div>

                  {/* 날짜 */}
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">상담일</div>
                    <div className="text-sm font-medium text-gray-900">
                      {consultation.date}
                    </div>
                  </div>

                  {/* 담당자 */}
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">담당자</div>
                    <div className="text-sm text-gray-900">
                      {consultation.contact_name} {consultation.contact_level}
                    </div>
                  </div>

                  {/* 상담자 */}
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">상담자</div>
                    <div className="text-sm text-gray-900">
                      {consultation.users?.name} {consultation.users?.level}
                    </div>
                  </div>
                </div>
              </div>

              {/* 우측 (b): 내용 + 문서 */}
              <div className="flex-1 p-4 flex flex-col">
                {/* 내용 */}
                <div className="text-sm text-gray-700 leading-relaxed flex-1">
                  {formatContentWithLineBreaks(consultation.content)}
                </div>

                {/* 문서 버튼들 (content 아래) */}
                <div className="flex items-center gap-2 flex-wrap mt-4 pt-3 border-t border-gray-100">
                  {["estimate", "order", "requestQuote"].map((type) => {
                    const filteredDocs = consultation.documents.filter(
                      (doc) => doc.type === type
                    );
                    if (filteredDocs.length > 0) {
                      return (
                        <div key={type} className="flex items-center gap-1">
                          <button
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <FileText size={14} />
                            {type === "estimate"
                              ? "견적서"
                              : type === "order"
                              ? "발주서"
                              : "의뢰서"}
                          </button>
                          <div className="flex flex-wrap gap-1">
                            {filteredDocs.map((doc) => (
                              <span
                                key={doc.id}
                                onClick={() => onDocumentClick(doc)}
                                className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
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

                  {/* 첨부파일 */}
                  {(consultation.file_count ?? 0) > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border border-gray-200 bg-white text-gray-600">
                      <Paperclip size={14} />
                      첨부파일
                      <span className="ml-0.5 bg-gray-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
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
