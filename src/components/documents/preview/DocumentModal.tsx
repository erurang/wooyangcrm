// components/DocumentModal.tsx
import React from "react";
import { Printer } from "lucide-react";
import { printDocument } from "@/utils/document-print-templates";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import DocumentPreview from "./DocumentPreview";

// Flexible document interface for modal display
interface ModalDocumentItem {
  name: string;
  spec?: string;
  quantity?: number | string;
  unit_price?: number;
  amount?: number;
}

interface ModalDocument {
  id: string;
  document_number: string;
  type: string;
  date?: string;
  content?: {
    items?: ModalDocumentItem[];
    company_name?: string;
    notes?: string;
    total_amount?: number;
    valid_until?: string;
    delivery_term?: string;
    delivery_place?: string;
    delivery_date?: string;
    payment_method?: string;
  };
  contact_name?: string;
  contact_level?: string;
  user_name?: string;
  user_level?: string;
  payment_method?: string;
  company_name?: string;
  notes?: string | null;
  total_amount?: number;
  valid_until?: string | null;
  delivery_term?: string | null;
  delivery_place?: string | null;
  delivery_date?: string | null;
}

interface DocumentModalProps {
  document: ModalDocument | null;
  onClose: () => void;
  company_fax: string;
  type: string;
  koreanAmount: (amount: number) => string;
  company_phone?: string;
}

const DocumentModal: React.FC<DocumentModalProps> = ({
  document,
  onClose,
  company_fax,
  type,
  koreanAmount,
  company_phone,
}) => {
  // ESC 키로 모달 닫기
  useEscapeKey(!!document, onClose);

  if (!document) return null;

  const handlePrint = () => {
    // Transform document to match PrintDocumentData requirements
    const printData = {
      document_number: document.document_number,
      date: document.date || new Date().toISOString().split("T")[0],
      contact_name: document.contact_name || "",
      contact_level: document.contact_level || "",
      user_name: document.user_name || "",
      user_level: document.user_level || "",
      payment_method: document.payment_method,
      content: {
        items: (document.content?.items || []).map((item) => ({
          name: item.name,
          spec: item.spec || "",
          quantity: String(item.quantity || 0),
          unit_price: Number(item.unit_price) || 0,
          amount: item.amount,
        })),
        company_name: document.content?.company_name,
        notes: document.content?.notes,
        total_amount: document.content?.total_amount,
        valid_until: document.content?.valid_until,
        delivery_term: document.content?.delivery_term,
        delivery_place: document.content?.delivery_place,
        delivery_date: document.content?.delivery_date,
      },
      company_name: document.company_name,
      notes: document.notes,
      total_amount: document.total_amount,
      valid_until: document.valid_until,
      delivery_term: document.delivery_term,
      delivery_place: document.delivery_place,
      delivery_date: document.delivery_date,
    };

    printDocument(type, printData, {
      company_phone,
      company_fax,
      koreanAmount,
    });
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
      <div
        className={`
          bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col
          w-full md:w-11/12 lg:w-4/5 xl:w-3/4 md:max-w-7xl
        `}
      >
        {/* 상단 액션 바 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {document.document_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* 프린트 버튼 */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Printer size={16} />
              프린트
            </button>
            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 문서 프리뷰 */}
          <div className="flex-1 overflow-y-auto p-6">
            <DocumentPreview
              document={document}
              type={type}
              company_phone={company_phone}
              company_fax={company_fax}
              koreanAmount={koreanAmount}
              onClose={onClose}
              onPrint={handlePrint}
              hideActions={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
