"use client";

import { useRouter } from "next/navigation";
import { FileText, ExternalLink } from "lucide-react";
import type {
  DashboardConsultation,
  DashboardDocument,
  DashboardDocumentItem,
} from "@/types/dashboard";

function getDocTypeLabel(type: string) {
  switch (type) {
    case "estimate": return "견적";
    case "order": return "발주";
    case "requestQuote": return "의뢰";
    default: return "기타";
  }
}

function getDocTypeColor(type: string) {
  switch (type) {
    case "estimate": return "bg-sky-50 text-sky-700 ring-1 ring-sky-200/50";
    case "order": return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50";
    case "requestQuote": return "bg-purple-50 text-purple-700 ring-1 ring-purple-200/50";
    default: return "bg-slate-50 text-slate-600 ring-1 ring-slate-200/50";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "pending": return "진행중";
    case "completed": return "완료";
    case "canceled": return "취소";
    default: return "-";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending": return "text-amber-700 bg-amber-50";
    case "completed": return "text-emerald-700 bg-emerald-50";
    case "canceled": return "text-rose-700 bg-rose-50";
    default: return "text-slate-500 bg-slate-50";
  }
}

interface ConsultationCardProps {
  consultation: DashboardConsultation;
  highlightDocId?: string | null;
}

export function ConsultationCard({ consultation, highlightDocId }: ConsultationCardProps) {
  const router = useRouter();

  const openDocument = (doc: DashboardDocument) => {
    router.push(`/documents/review?highlight=${doc.document_id}`);
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* 상담 헤더 */}
      <div
        className="p-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => router.push(`/consultations/${consultation.company_id}`)}
      >
        <div className="flex justify-between items-start mb-1.5">
          <span className="font-bold text-sky-700 text-sm">
            {consultation.company_name}
          </span>
          <span className="text-[11px] text-slate-400 font-medium tabular-nums">{consultation.date}</span>
        </div>
        <p className="text-slate-600 text-sm whitespace-pre-line line-clamp-2 leading-relaxed">
          {consultation.content}
        </p>
      </div>

      {/* 문서 목록 */}
      {consultation.documents.length > 0 ? (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {consultation.documents.map((doc: DashboardDocument) => {
            const isHighlighted = highlightDocId === doc.document_id;
            const hasItems = doc.items && doc.items.length > 0;

            return (
              <div
                key={doc.document_id}
                id={`doc-${doc.document_id}`}
                className={`transition-colors ${
                  isHighlighted ? "bg-yellow-50 ring-2 ring-yellow-300 ring-inset" : ""
                }`}
              >
                {/* 문서 헤더 */}
                <div className="flex items-center justify-between p-2.5 px-3">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${getDocTypeColor(doc.type)}`}>
                      {getDocTypeLabel(doc.type)}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 truncate">
                      {doc.document_number}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${getStatusColor(doc.status)}`}>
                      {getStatusText(doc.status)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDocument(doc);
                    }}
                    className="p-1 text-slate-300 hover:text-sky-600 transition-colors rounded-md hover:bg-sky-50"
                    title="문서 열기"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 품목 리스트 */}
                {hasItems && (
                  <div className="px-3 pb-2.5">
                    <div className="bg-slate-50/80 rounded-lg p-1.5 space-y-0.5">
                      {doc.items?.map((item: DashboardDocumentItem, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-white rounded-md"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-slate-700">
                              {item.name}
                            </span>
                            {item.spec && (
                              <span className="text-slate-400 ml-1 text-[11px]">
                                ({item.spec})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs flex-shrink-0 ml-2">
                            <span className="text-slate-400 tabular-nums">x{item.quantity}</span>
                            <span className="font-bold text-sky-600 tabular-nums">
                              {Number(item.amount).toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-t border-slate-100 p-3 text-center">
          <FileText className="w-4 h-4 mx-auto mb-1 text-slate-300" />
          <span className="text-xs text-slate-400">문서 없음</span>
        </div>
      )}
    </div>
  );
}
