// components/DocumentModal.tsx
import React from "react";
import { printDocument } from "@/utils/document-print-templates";
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
    <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
      <div
        className={`
        bg-white p-6 rounded-md max-h-screen overflow-y-scroll
        w-full md:w-2/3 md:max-w-6xl
      `}
      >
        <DocumentPreview
          document={document}
          type={type}
          company_phone={company_phone}
          company_fax={company_fax}
          koreanAmount={koreanAmount}
          onClose={onClose}
          onPrint={handlePrint}
        />
      </div>
    </div>
  );
};

export default DocumentModal;
