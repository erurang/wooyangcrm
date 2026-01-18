"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronRight, Calendar, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import type { ExpiringDocument } from "@/hooks/dashboard/useExpiringDocuments";

interface ExpiringDocumentsCardProps {
  estimates: ExpiringDocument[];
  orders: ExpiringDocument[];
  isLoading?: boolean;
  onViewAll: () => void;
}

function getDaysLabel(days: number): { text: string; color: string; bgColor: string } {
  if (days === 0) {
    return { text: "D-Day", color: "text-red-700", bgColor: "bg-red-100" };
  } else if (days === 1) {
    return { text: "D-1", color: "text-red-600", bgColor: "bg-red-50" };
  } else if (days <= 3) {
    return { text: `D-${days}`, color: "text-orange-600", bgColor: "bg-orange-50" };
  } else {
    return { text: `D-${days}`, color: "text-amber-600", bgColor: "bg-amber-50" };
  }
}

function formatAmount(amount: number) {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
  return amount.toLocaleString();
}

export default function ExpiringDocumentsCard({
  estimates,
  orders,
  isLoading = false,
  onViewAll,
}: ExpiringDocumentsCardProps) {
  const router = useRouter();
  const totalCount = estimates.length + orders.length;

  // 합쳐서 D-day 순으로 정렬하고 최대 5개만 표시
  const allDocuments = [...estimates, ...orders]
    .sort((a, b) => a.days_remaining - b.days_remaining)
    .slice(0, 5);

  const openDocument = (doc: ExpiringDocument) => {
    window.open(
      `/documents/${doc.type}?consultId=${doc.consultation_id}&compId=${doc.company_id}&fullscreen=true`,
      "_blank",
      "width=1200,height=800,top=100,left=100"
    );
  };

  const goToDocumentsList = (doc: ExpiringDocument) => {
    router.push(`/documents/details?type=${doc.type}&status=pending&highlight=${doc.id}`);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full">
        <div className="flex items-center mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
          <h2 className="text-sm font-semibold text-slate-800">임박 문서</h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-2">
              <div className="h-5 w-10 bg-slate-200 rounded"></div>
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

  if (totalCount === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full">
        <div className="flex items-center mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
          <h2 className="text-sm font-semibold text-slate-800">임박 문서</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-32 text-slate-500">
          <Calendar className="h-6 w-6 text-emerald-400 mb-2" />
          <p className="text-sm">임박한 문서가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h2 className="text-sm font-semibold text-slate-800">임박 문서</h2>
          {/* 매입/매출 개수 표시 */}
          <div className="flex items-center gap-1.5">
            {orders.length > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                <TrendingDown className="h-3 w-3" />
                {orders.length}
              </span>
            )}
            {estimates.length > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                <TrendingUp className="h-3 w-3" />
                {estimates.length}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center"
        >
          전체보기
          <ChevronRight className="h-3 w-3 ml-0.5" />
        </button>
      </div>

      <div className="space-y-1 max-h-[280px] overflow-y-auto">
        {allDocuments.map((doc) => {
          const daysInfo = getDaysLabel(doc.days_remaining);
          const isOrder = doc.type === "order";
          const typeLabel = isOrder ? "발주" : "견적";
          const typeBgColor = isOrder ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700";

          return (
            <div
              key={doc.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
              onClick={() => goToDocumentsList(doc)}
            >
              {/* Type label */}
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${typeBgColor}`}>
                {typeLabel}
              </span>

              {/* D-day badge */}
              <span className={`px-2 py-0.5 text-xs font-bold rounded ${daysInfo.bgColor} ${daysInfo.color} min-w-[42px] text-center`}>
                {daysInfo.text}
              </span>

              {/* Document info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700 text-sm truncate group-hover:text-amber-700 transition-colors">
                    {doc.company_name}
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

              {/* Open in new window button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDocument(doc);
                }}
                className="p-1.5 rounded-md hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors opacity-0 group-hover:opacity-100"
                title="새 창에서 열기"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
