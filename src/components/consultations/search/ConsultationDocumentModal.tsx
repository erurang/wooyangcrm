"use client";

import { AnimatePresence, motion } from "framer-motion";
import DocumentModal from "@/components/documents/preview/DocumentModal";
import { numberToKorean } from "@/lib/numberToKorean";

interface Document {
  id: string;
  type: "estimate" | "requestQuote" | "order";
  document_number: string;
  content: {
    items: Array<{
      name: string;
      spec: string;
      quantity: number;
      unit_price: number;
      amount: number;
    }>;
  };
  // 새 외부 컬럼들
  company_name?: string;
  total_amount?: number;
  delivery_date?: string;
  valid_until?: string;
  delivery_place?: string;
  delivery_term?: string;
  notes?: string;
  // 모달용 추가 필드
  contact_name?: string;
  contact_level?: string;
  contact_mobile?: string;
  company_fax?: string;
  company_tel?: string;
  company_phone?: string;
  user_name?: string;
  user_level?: string;
  payment_method?: string;
}

interface ConsultationDocumentModalProps {
  isOpen: boolean;
  document: Document | null;
  onClose: () => void;
}

export default function ConsultationDocumentModal({
  isOpen,
  document,
  onClose,
}: ConsultationDocumentModalProps) {
  if (!isOpen || !document) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>

          <DocumentModal
            type={document.type}
            koreanAmount={numberToKorean}
            company_fax={document.company_phone || ""}
            company_phone={document.company_fax || ""}
            document={document}
            onClose={onClose}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
