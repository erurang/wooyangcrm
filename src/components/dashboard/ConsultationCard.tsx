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
    case "estimate":
      return "견적서";
    case "order":
      return "발주서";
    case "requestQuote":
      return "의뢰서";
    default:
      return "기타";
  }
}

function getDocTypeColor(type: string) {
  switch (type) {
    case "estimate":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "order":
      return "bg-green-100 text-green-700 border-green-200";
    case "requestQuote":
      return "bg-purple-100 text-purple-700 border-purple-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "pending":
      return "진행중";
    case "completed":
      return "완료";
    case "canceled":
      return "취소";
    default:
      return "-";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "text-amber-600 bg-amber-50";
    case "completed":
      return "text-emerald-600 bg-emerald-50";
    case "canceled":
      return "text-rose-600 bg-rose-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

interface ConsultationCardProps {
  consultation: DashboardConsultation;
  highlightDocId?: string | null;
}

export function ConsultationCard({ consultation, highlightDocId }: ConsultationCardProps) {
  const router = useRouter();

  const openDocument = (doc: DashboardDocument) => {
    window.open(
      `/documents/${doc.type}?consultId=${consultation.consultation_id}&compId=${consultation.company_id}&fullscreen=true`,
      "_blank",
      "width=1200,height=800,top=100,left=100"
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      {/* 상담 헤더 */}
      <div
        className="p-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100"
        onClick={() => router.push(`/consultations/${consultation.company_id}`)}
      >
        <div className="flex justify-between items-start mb-1">
          <span className="font-semibold text-indigo-600 text-sm">
            {consultation.company_name}
          </span>
          <span className="text-xs text-slate-500">{consultation.date}</span>
        </div>
        <p className="text-slate-700 text-sm whitespace-pre-line line-clamp-3">
          {consultation.content}
        </p>
      </div>

      {/* 문서 목록 (항상 펼침) */}
      {consultation.documents.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {consultation.documents.map((doc: DashboardDocument) => {
            const isHighlighted = highlightDocId === doc.document_id;
            const hasItems = doc.items && doc.items.length > 0;

            return (
              <div
                key={doc.document_id}
                id={`doc-${doc.document_id}`}
                className={`transition-colors ${
                  isHighlighted ? "bg-yellow-50 ring-2 ring-yellow-400" : ""
                }`}
              >
                {/* 문서 헤더 */}
                <div className="flex items-center justify-between p-2 px-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className={`px-1.5 py-0.5 text-xs font-medium rounded border ${getDocTypeColor(
                        doc.type
                      )}`}
                    >
                      {getDocTypeLabel(doc.type)}
                    </span>
                    <span className="text-xs font-medium text-slate-700 truncate">
                      {doc.document_number}
                    </span>
                    <span
                      className={`px-1 py-0.5 text-xs rounded ${getStatusColor(
                        doc.status
                      )}`}
                    >
                      {getStatusText(doc.status)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDocument(doc);
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="문서 열기"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                {/* 품목 리스트 (항상 표시) */}
                {hasItems && (
                  <div className="px-3 pb-2">
                    <div className="bg-slate-50 rounded p-1.5 space-y-0.5">
                      {doc.items?.map((item: DashboardDocumentItem, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-slate-700">
                              {item.name}
                            </span>
                            {item.spec && (
                              <span className="text-slate-400 ml-1">
                                ({item.spec})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">x{item.quantity}</span>
                            <span className="font-semibold text-indigo-600">
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
        <div className="p-2 text-center text-slate-400 text-xs">
          <FileText className="w-4 h-4 mx-auto mb-1 opacity-50" />
          문서 없음
        </div>
      )}
    </div>
  );
}
