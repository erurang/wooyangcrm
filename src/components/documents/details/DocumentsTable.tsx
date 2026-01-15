"use client";

import { Clock, CheckCircle, XCircle } from "lucide-react";
import { CircularProgress } from "@mui/material";
import EmptyState from "@/components/ui/EmptyState";

interface DocumentItem {
  name: string;
  spec?: string;
  quantity?: number | string;
  unit_price?: number;
  amount?: number;
}

interface Document {
  id: string;
  type: string;
  status: "pending" | "completed" | "canceled" | "expired";
  document_number: string;
  contact_name: string;
  contact_level: string;
  user_name: string;
  user_level: string;
  user_id: string;
  company_id: string;
  date: string;
  created_at: string;
  consultation_id: string;
  companies: {
    phone?: string;
    fax?: string;
  };
  content: {
    items?: DocumentItem[];
  };
  // 분리된 컬럼들
  company_name: string;
  valid_until: string | null;
  delivery_date: string | null;
  total_amount: number;
  status_reason: {
    canceled: { reason: string; amount: number };
    completed: { reason: string; amount: number };
  };
}

interface DocumentsTableProps {
  documents: Document[];
  type: string;
  loginUserId?: string;
  isLoading: boolean;
  onDocumentClick: (doc: Document) => void;
  onCompanyClick: (companyId: string) => void;
  onStatusChange: (doc: Document, status: string) => void;
}

export default function DocumentsTable({
  documents,
  type,
  loginUserId,
  isLoading,
  onDocumentClick,
  onCompanyClick,
  onStatusChange,
}: DocumentsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="flex justify-center items-center py-20">
          <CircularProgress size={40} />
        </div>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        <EmptyState type="document" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {type === "estimate" && "견적일"}
                {type === "order" && "발주일"}
                {type === "requestQuote" && "의뢰일"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                {type === "estimate" && "견적유효기간"}
                {type === "order" && "납기일"}
                {type === "requestQuote" && "희망견적일"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                거래처명
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                문서 번호
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                담당자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                {type === "estimate" && "견적자"}
                {type === "order" && "발주자"}
                {type === "requestQuote" && "의뢰자"}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                비고
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{doc.date}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  <div className="text-sm text-gray-900">
                    {type === "estimate" && doc.valid_until &&
                      new Date(doc.valid_until).toLocaleDateString()}
                    {type === "order" && doc.delivery_date}
                    {type === "requestQuote" && doc.delivery_date}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                    onClick={() => onCompanyClick(doc.company_id)}
                  >
                    {doc.company_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                    onClick={() => onDocumentClick(doc)}
                  >
                    {doc.document_number}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  <div className="text-sm text-gray-900">
                    {doc.contact_name} {doc.contact_level}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  <div className="text-sm text-gray-900">
                    {doc.user_name} {doc.user_level}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      doc.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : doc.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : doc.status === "expired"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {doc.status === "pending" && (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {doc.status === "completed" && (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    )}
                    {doc.status === "canceled" && (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {doc.status === "expired" && (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {doc.status === "pending" && "진행중"}
                    {doc.status === "completed" && "완료"}
                    {doc.status === "canceled" && "취소"}
                    {doc.status === "expired" && "만료"}
                  </span>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="text-sm text-gray-900">
                    {doc.status === "pending" ? (
                      doc.user_id === loginUserId ? (
                        <div className="flex space-x-2">
                          {["completed", "canceled"].map((status) => (
                            <button
                              key={status}
                              className={`px-3 py-1 text-xs rounded-md ${
                                status === "completed"
                                  ? "bg-green-50 text-green-600 hover:bg-green-100"
                                  : "bg-red-50 text-red-600 hover:bg-red-100"
                              } transition-colors`}
                              onClick={() => onStatusChange(doc, status)}
                            >
                              {status === "completed" ? "완료" : "취소"}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">수정 권한 없음</span>
                      )
                    ) : (
                      <>
                        {doc.status === "completed"
                          ? doc.status_reason?.completed?.reason
                          : doc.status_reason?.canceled?.reason}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
