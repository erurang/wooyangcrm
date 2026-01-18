"use client";

import { useRouter } from "next/navigation";
import { FileText, ChevronRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface RecentDocument {
  id: string;
  type: string;
  status: string;
  document_number: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  company_id: string;
  company_name: string;
  consultation_id: string;
}

interface RecentDocumentsCardProps {
  documents: RecentDocument[];
  isLoading?: boolean;
}

function getDocTypeLabel(type: string) {
  switch (type) {
    case "estimate":
      return "견적서";
    case "order":
      return "발주서";
    case "requestQuote":
      return "의뢰서";
    default:
      return "문서";
  }
}

function getDocTypeColor(type: string) {
  switch (type) {
    case "estimate":
      return "bg-blue-100 text-blue-700";
    case "order":
      return "bg-green-100 text-green-700";
    case "requestQuote":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
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
      return "text-amber-600";
    case "completed":
      return "text-emerald-600";
    case "canceled":
      return "text-rose-600";
    default:
      return "text-gray-600";
  }
}

export default function RecentDocumentsCard({
  documents,
  isLoading = false,
}: RecentDocumentsCardProps) {
  const router = useRouter();

  const openDocument = (doc: RecentDocument) => {
    router.push(`/documents/review?highlight=${doc.id}`);
  };

  const formatAmount = (amount: number) => {
    if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
    if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
    return amount.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full">
        <div className="flex items-center mb-3">
          <FileText className="h-4 w-4 text-cyan-600 mr-2" />
          <h2 className="text-sm font-semibold text-slate-800">최근 문서</h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-2">
              <div className="h-5 w-12 bg-slate-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-slate-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full">
        <div className="flex items-center mb-3">
          <FileText className="h-4 w-4 text-cyan-600 mr-2" />
          <h2 className="text-sm font-semibold text-slate-800">최근 문서</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-32 text-slate-500">
          <FileText className="h-6 w-6 text-cyan-300 mb-2" />
          <p className="text-sm">최근 문서가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <FileText className="h-4 w-4 text-cyan-600 mr-2" />
          <h2 className="text-sm font-semibold text-slate-800">최근 문서</h2>
        </div>
        <button
          onClick={() => router.push("/documents/review")}
          className="text-xs text-cyan-600 hover:text-cyan-800 font-medium flex items-center"
        >
          전체보기
          <ChevronRight className="h-3 w-3 ml-0.5" />
        </button>
      </div>

      <div className="space-y-1">
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => openDocument(doc)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
          >
            {/* Document type badge */}
            <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getDocTypeColor(doc.type)}`}>
              {getDocTypeLabel(doc.type)}
            </span>

            {/* Document info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700 text-sm truncate group-hover:text-cyan-700 transition-colors">
                  {doc.company_name}
                </span>
                <span className={`text-xs ${getStatusColor(doc.status)}`}>
                  {getStatusText(doc.status)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="truncate">{doc.document_number}</span>
                {doc.total_amount > 0 && (
                  <span className="text-blue-600 font-medium">
                    {formatAmount(doc.total_amount)}
                  </span>
                )}
              </div>
            </div>

            {/* Time ago */}
            <div className="flex items-center text-xs text-slate-400">
              <Clock className="h-3 w-3 mr-0.5" />
              {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true, locale: ko })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
