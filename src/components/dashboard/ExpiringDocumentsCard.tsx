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

function getDaysLabel(days: number): { text: string; color: string; bgColor: string; urgency: "critical" | "warning" | "normal" } {
  if (days < 0) {
    return { text: `+${Math.abs(days)}일`, color: "text-slate-600", bgColor: "bg-slate-100", urgency: "normal" };
  } else if (days === 0) {
    return { text: "D-Day", color: "text-white", bgColor: "bg-red-500", urgency: "critical" };
  } else if (days === 1) {
    return { text: "D-1", color: "text-red-700", bgColor: "bg-red-100", urgency: "critical" };
  } else if (days <= 3) {
    return { text: `D-${days}`, color: "text-orange-700", bgColor: "bg-orange-100", urgency: "warning" };
  } else {
    return { text: `D-${days}`, color: "text-amber-700", bgColor: "bg-amber-50", urgency: "normal" };
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

  const allDocuments = [...estimates, ...orders]
    .sort((a, b) => a.days_remaining - b.days_remaining)
    .slice(0, 5);

  const goToDocumentsList = (doc: ExpiringDocument) => {
    router.push(`/documents/review?highlight=${doc.id}`);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 h-full">
        <div className="flex items-center mb-4">
          <div className="p-1.5 bg-amber-50 rounded-lg mr-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">임박 문서</h2>
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-2">
              <div className="h-5 w-10 bg-slate-100 rounded-md" />
              <div className="flex-1">
                <div className="h-4 bg-slate-100 rounded w-24 mb-1" />
                <div className="h-3 bg-slate-100 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 h-full">
        <div className="flex items-center mb-4">
          <div className="p-1.5 bg-amber-50 rounded-lg mr-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">임박 문서</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-32 text-slate-400">
          <Calendar className="h-8 w-8 text-emerald-300 mb-2" />
          <p className="text-sm font-medium text-emerald-600">임박한 문서가 없습니다</p>
          <p className="text-xs text-slate-400 mt-0.5">모든 문서 기한이 여유 있습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">임박 문서</h2>
          <div className="flex items-center gap-1">
            {orders.length > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-full">
                <TrendingDown className="h-2.5 w-2.5" />
                {orders.length}
              </span>
            )}
            {estimates.length > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">
                <TrendingUp className="h-2.5 w-2.5" />
                {estimates.length}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-0.5 hover:gap-1 transition-all"
        >
          전체보기
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-1 max-h-[280px] overflow-y-auto scrollbar-thin">
        {allDocuments.map((doc) => {
          const daysInfo = getDaysLabel(doc.days_remaining);
          const isOrder = doc.type === "order";
          const typeLabel = isOrder ? "발주" : "견적";
          const typeBgColor = isOrder ? "bg-purple-50 text-purple-700 ring-1 ring-purple-200/50" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50";

          return (
            <div
              key={doc.id}
              className={`
                flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all duration-200 group
                hover:bg-slate-50 hover:shadow-sm
                ${daysInfo.urgency === "critical" ? "bg-red-50/30" : ""}
              `}
              onClick={() => goToDocumentsList(doc)}
            >
              {/* Type label */}
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${typeBgColor}`}>
                {typeLabel}
              </span>

              {/* D-day badge */}
              <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${daysInfo.bgColor} ${daysInfo.color} min-w-[40px] text-center tabular-nums`}>
                {daysInfo.text}
              </span>

              {/* Document info */}
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-700 text-sm truncate block group-hover:text-amber-700 transition-colors">
                  {doc.company_name}
                </span>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="truncate">{doc.document_number}</span>
                  {doc.total_amount > 0 && (
                    <span className="text-sky-600 font-semibold tabular-nums">
                      {formatAmount(doc.total_amount)}
                    </span>
                  )}
                </div>
              </div>

              {/* Open button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToDocumentsList(doc);
                }}
                className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-300 hover:text-amber-600 transition-all opacity-0 group-hover:opacity-100"
                title="문서 열기"
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
