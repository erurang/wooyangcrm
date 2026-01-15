"use client";

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

interface RecentDocumentModalProps {
  isOpen: boolean;
  document: Document | null;
  onClose: () => void;
}

export default function RecentDocumentModal({
  isOpen,
  document,
  onClose,
}: RecentDocumentModalProps) {
  if (!isOpen || !document) return null;

  return (
    <DocumentModal
      type={document.type}
      koreanAmount={numberToKorean}
      company_fax={document.company_phone || ""}
      company_phone={document.company_fax || ""}
      document={document}
      onClose={onClose}
    />
  );
}
