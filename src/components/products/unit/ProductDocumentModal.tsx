"use client";

import DocumentModal from "@/components/documents/preview/DocumentModal";
import { numberToKorean } from "@/lib/numberToKorean";
import { useDocument } from "@/hooks/documents/useDocument";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface ProductDocumentModalProps {
  documentId: string | null;
  type: "estimate" | "order";
  onClose: () => void;
}

export default function ProductDocumentModal({
  documentId,
  type,
  onClose,
}: ProductDocumentModalProps) {
  const { document, isLoading } = useDocument(documentId);

  // ESC 키로 모달 닫기
  useEscapeKey(!!documentId, onClose);

  if (!documentId) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
        <div className="bg-white p-8 rounded-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">문서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!document) return null;

  return (
    <DocumentModal
      type={type}
      koreanAmount={numberToKorean}
      company_fax={document.company_fax || ""}
      company_phone={document.company_phone || ""}
      document={document}
      onClose={onClose}
    />
  );
}
