"use client";

import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { getStatusText, getStatusColor, getDocTypeLabel } from "@/utils/dashboard-helpers";

interface DocumentItem {
  name: string;
  spec?: string;
  quantity?: number | string;
  unit_price?: number;
  amount: number;
}

interface TabDocument {
  document_number?: string;
  type: string;
  status: string;
  created_at?: string;
  user?: {
    name: string;
    level: string;
  };
  items?: DocumentItem[];
}

interface DocumentsTabProps {
  documents: TabDocument[];
  documentFilter: "all" | "estimate" | "order";
  statusFilter: "all" | "pending" | "completed" | "canceled";
  onDocumentFilterChange: (filter: "all" | "estimate" | "order") => void;
  onStatusFilterChange: (filter: "all" | "pending" | "completed" | "canceled") => void;
}

export default function DocumentsTab({
  documents,
  documentFilter,
  statusFilter,
  onDocumentFilterChange,
  onStatusFilterChange,
}: DocumentsTabProps) {
  const filteredDocuments = documents.filter((doc) => {
    const matchesType = documentFilter === "all" || doc.type === documentFilter;
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    return matchesType && matchesStatus;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-indigo-600 mr-2" />
          <h2 className="text-lg font-semibold text-slate-800">문서 관리</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={documentFilter}
            onChange={(e) =>
              onDocumentFilterChange(e.target.value as "all" | "estimate" | "order")
            }
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">모든 문서</option>
            <option value="estimate">견적서</option>
            <option value="order">발주서</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(
                e.target.value as "all" | "pending" | "completed" | "canceled"
              )
            }
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">모든 상태</option>
            <option value="pending">진행 중</option>
            <option value="completed">완료됨</option>
            <option value="canceled">취소됨</option>
          </select>
        </div>
      </div>

      {filteredDocuments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  문서 번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  생성일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  담당자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  금액
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredDocuments.map((doc, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer">
                    {doc.document_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {getDocTypeLabel(doc.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {doc.created_at?.split("T")[0] || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {doc.user ? `${doc.user.name} (${doc.user.level})` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        doc.status
                      )}`}
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
                      {getStatusText(doc.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-800">
                    {(doc.items || [])
                      .reduce((sum, item) => sum + item.amount, 0)
                      .toLocaleString()}{" "}
                    원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg">문서가 없습니다</p>
          <p className="text-slate-400 text-sm mt-2">필터를 변경해보세요</p>
        </div>
      )}
    </div>
  );
}
