"use client";

import { FileText, Search } from "lucide-react";
import { getStatusText, getStatusColor, getDocTypeLabel } from "@/utils/dashboard-helpers";

interface DocumentItem {
  name: string;
  spec?: string;
  quantity?: string | number;
  amount: number;
}

interface DocumentUser {
  name: string;
  level: string;
}

interface ConsultationDocument {
  document_number?: string;
  document_id?: string;
  type: string;
  status: string;
  created_at?: string;
  user?: DocumentUser;
  items?: DocumentItem[];
}

interface Consultation {
  date: string;
  content: string;
  documents: ConsultationDocument[];
}

interface ConsultationsTabProps {
  consultations: Consultation[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function ConsultationsTab({
  consultations,
  searchTerm,
  onSearchChange,
}: ConsultationsTabProps) {
  const filteredConsultations = consultations.filter((consultation) => {
    if (!searchTerm) return true;
    return consultation.content.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-sky-600 mr-2" />
          <h2 className="text-lg font-semibold text-slate-800">상담 내역</h2>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="상담 내용 검색..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="space-y-6 overflow-y-auto max-h-[700px] pr-2">
        {filteredConsultations.length > 0 ? (
          filteredConsultations.map((consultation, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-[1fr_0.5fr_1.5fr] gap-6 items-start border-b border-slate-200 pb-6"
            >
              {/* Consultation Content */}
              <div className="p-4 border border-slate-200 rounded-lg bg-white hover:bg-sky-50 cursor-pointer transition-colors shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500">
                    {consultation.date}
                  </span>
                </div>
                <p className="text-slate-800 whitespace-pre-line text-sm">
                  {consultation.content}
                </p>
              </div>

              {/* Related Documents */}
              <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                {consultation.documents.length > 0 ? (
                  consultation.documents.map((doc, docIndex) => (
                    <div
                      key={docIndex}
                      className="mb-2 p-3 border border-slate-200 rounded-lg bg-white shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-md ${getStatusColor(
                            doc.status
                          )}`}
                        >
                          {getStatusText(doc.status)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {doc.created_at?.split("T")[0]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">
                        {getDocTypeLabel(doc.type)}:{" "}
                        <span className="text-sky-600 font-semibold">
                          {doc.document_number || doc.document_id}
                        </span>
                      </p>
                      {doc.user && (
                      <p className="text-xs mt-1">
                        담당자:{" "}
                        <span className="font-semibold">{doc.user.name}</span> (
                        {doc.user.level})
                      </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm">📂 관련 문서 없음</p>
                )}
              </div>

              {/* Items List */}
              <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                {consultation.documents.length > 0 ? (
                  consultation.documents.flatMap((doc) =>
                    (doc.items?.length ?? 0) > 0 ? (
                      doc.items?.map((item, itemIndex) => (
                        <div
                          key={`${doc.document_number || doc.document_id}-${itemIndex}`}
                          className="grid grid-cols-[2fr_1fr_0.5fr_0.5fr] gap-2 p-3 border border-slate-200 rounded-lg bg-slate-50 text-sm mb-2"
                        >
                          <span className="text-slate-700 font-medium">
                            {item.name}
                          </span>
                          <span className="text-slate-500">{item.spec}</span>
                          <span className="text-slate-500 text-center">
                            {item.quantity}
                          </span>
                          <span className="text-sky-600 font-semibold text-right">
                            {Number(item.amount).toLocaleString()} 원
                          </span>
                        </div>
                      ))
                    ) : (
                      <p
                        key={doc.document_number}
                        className="text-slate-400 text-sm mb-2"
                      >
                        📦 {getDocTypeLabel(doc.type)} 품목 없음
                      </p>
                    )
                  )
                ) : (
                  <p className="text-slate-400 text-sm">📦 품목 없음</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">검색 결과가 없습니다</p>
            <p className="text-slate-400 text-sm mt-2">
              다른 검색어로 시도해보세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
