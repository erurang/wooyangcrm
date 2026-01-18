"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  Calendar,
  FileText,
} from "lucide-react";
import type { ExpiringDocument } from "@/hooks/dashboard/useExpiringDocuments";

interface ExpiringDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  estimates: ExpiringDocument[];
  orders: ExpiringDocument[];
  isLoading?: boolean;
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

function DocumentList({
  documents,
  type,
  onNavigate,
  onOpenDocument,
}: {
  documents: ExpiringDocument[];
  type: "estimate" | "order";
  onNavigate: (doc: ExpiringDocument) => void;
  onOpenDocument: (doc: ExpiringDocument) => void;
}) {
  const dateLabel = type === "estimate" ? "유효기간" : "납기일";
  const typeLabel = type === "estimate" ? "견적서" : "발주서";

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400">
        <Calendar className="h-8 w-8 mb-2" />
        <p className="text-sm">임박한 {typeLabel}가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const daysInfo = getDaysLabel(doc.days_remaining);
        return (
          <div
            key={doc.id}
            className="group flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
            onClick={() => onNavigate(doc)}
          >
            {/* D-day badge */}
            <span className={`px-2 py-1 text-xs font-bold rounded ${daysInfo.bgColor} ${daysInfo.color} min-w-[48px] text-center`}>
              {daysInfo.text}
            </span>

            {/* Document info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700 text-sm truncate">
                  {doc.company_name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="truncate">{doc.document_number}</span>
                <span className="text-slate-300">|</span>
                <span>{dateLabel}: {type === "estimate" ? doc.valid_until : doc.delivery_date}</span>
              </div>
            </div>

            {/* Amount */}
            {doc.total_amount > 0 && (
              <span className="text-sm font-medium text-blue-600">
                {formatAmount(doc.total_amount)}
              </span>
            )}

            {/* Open in new window */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDocument(doc);
              }}
              className="p-1.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
              title="새 창에서 열기"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function ExpiringDocumentsModal({
  isOpen,
  onClose,
  estimates,
  orders,
  isLoading = false,
}: ExpiringDocumentsModalProps) {
  const router = useRouter();

  const navigateToDocument = (doc: ExpiringDocument) => {
    router.push(`/documents/details?type=${doc.type}&status=pending&highlight=${doc.id}`);
    onClose();
  };

  const openDocument = (doc: ExpiringDocument) => {
    window.open(
      `/documents/${doc.type}?consultId=${doc.consultation_id}&compId=${doc.company_id}&fullscreen=true`,
      "_blank",
      "width=1200,height=800,top=100,left=100"
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1000] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-slate-800">임박 문서 현황</h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                총 {estimates.length + orders.length}건
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Content - Split View */}
          <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-slate-200">
            {/* Left: Orders (매입) */}
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 border-b border-slate-200">
                <TrendingDown className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-purple-800">매입 (납기 임박)</h3>
                <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                  {orders.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                        <div className="h-6 w-12 bg-slate-200 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-slate-200 rounded w-32"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DocumentList
                    documents={orders}
                    type="order"
                    onNavigate={navigateToDocument}
                    onOpenDocument={openDocument}
                  />
                )}
              </div>
            </div>

            {/* Right: Estimates (매출) */}
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border-b border-slate-200">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold text-green-800">매출 (유효기간 임박)</h3>
                <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  {estimates.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                        <div className="h-6 w-12 bg-slate-200 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-slate-200 rounded w-32"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DocumentList
                    documents={estimates}
                    type="estimate"
                    onNavigate={navigateToDocument}
                    onOpenDocument={openDocument}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
            클릭하면 해당 문서로 이동합니다 • 7일 이내 임박 문서만 표시됩니다
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
