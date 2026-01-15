"use client";

import { Edit, Trash2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import type { ProcessedConsultation } from "@/types/consultation";

interface User {
  id: string;
  name: string;
  level: string;
}

interface ConsultationTableProps {
  consultations: ProcessedConsultation[];
  users: User[];
  companyId: string;
  loginUserId: string;
  currentPage: number;
  totalPages: number;
  searchTerm: string;
  onContactClick: (contactId: string) => void;
  onEditConsultation: (consultation: ProcessedConsultation) => void;
  onDeleteConsultation: (consultation: ProcessedConsultation) => void;
  onPageChange: (page: number) => void;
}

export default function ConsultationTable({
  consultations,
  users,
  companyId,
  loginUserId,
  currentPage,
  totalPages,
  searchTerm,
  onContactClick,
  onEditConsultation,
  onDeleteConsultation,
  onPageChange,
}: ConsultationTableProps) {
  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  const paginationNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pageNumbers.push(i);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        pageNumbers.push("...");
      }
    }
    return pageNumbers;
  };

  const openDocumentWindow = (type: string, consultationId: string) => {
    window.open(
      `/documents/${type}?consultId=${consultationId}&compId=${companyId}&fullscreen=true`,
      "_blank",
      "width=1200,height=800,top=100,left=100"
    );
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm mb-6">
      <div className="overflow-x-auto">
        {consultations && consultations.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 table-fixed sm:table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 sm:w-20">
                  날짜
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 sm:w-24">
                  담당자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 sm:w-24 hidden sm:table-cell">
                  상담자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  내용
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 sm:w-16">
                  문서
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 sm:w-16">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consultations.map((consultation) => (
                <tr key={consultation.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:w-auto">
                    <div>{consultation.date}</div>
                    {consultation.follow_up_date && (
                      <div className="text-xs text-gray-500 mt-1">
                        ~ {consultation.follow_up_date}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:w-auto">
                    <div
                      className="font-medium text-blue-600 cursor-pointer hover:underline"
                      onClick={() => onContactClick(consultation.contact_id || "")}
                    >
                      {consultation.contact_name} {consultation.contact_level}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:w-auto hidden sm:table-cell">
                    {users.find((user) => user.id === consultation.user_id)?.name}{" "}
                    {users.find((user) => user.id === consultation.user_id)?.level}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 sm:w-auto">
                    <div className="max-h-32 overflow-y-auto w-screen md:w-auto">
                      {formatContentWithLineBreaks(consultation.content)}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm sm:w-auto">
                    <div className="space-y-2">
                      <button
                        className={`block w-full text-left px-2 py-1 rounded ${
                          consultation.documents.estimate
                            ? "text-blue-600 hover:bg-blue-50"
                            : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => openDocumentWindow("estimate", consultation.id)}
                      >
                        <span className="flex items-center">
                          <FileText size={14} className="mr-1.5" />
                          견적서
                        </span>
                      </button>

                      <button
                        className={`block w-full text-left px-2 py-1 rounded ${
                          consultation.documents.order
                            ? "text-blue-600 hover:bg-blue-50"
                            : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => openDocumentWindow("order", consultation.id)}
                      >
                        <span className="flex items-center">
                          <FileText size={14} className="mr-1.5" />
                          발주서
                        </span>
                      </button>

                      <button
                        className={`block w-full text-left px-2 py-1 rounded ${
                          consultation.documents.requestQuote
                            ? "text-blue-600 hover:bg-blue-50"
                            : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => openDocumentWindow("requestQuote", consultation.id)}
                      >
                        <span className="flex items-center">
                          <FileText size={14} className="mr-1.5" />
                          의뢰서
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:w-auto">
                    {loginUserId === consultation.user_id && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEditConsultation(consultation)}
                          className="text-blue-600 hover:text-blue-800"
                          title="수정"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => onDeleteConsultation(consultation)}
                          className="text-red-600 hover:text-red-800"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-8 text-center text-gray-500">
            {searchTerm ? "검색 결과가 없습니다." : "상담 내역이 없습니다."}
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t flex items-center justify-center">
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-2 py-1 rounded-md ${
                currentPage === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronLeft size={18} />
            </button>

            {paginationNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && onPageChange(page)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : page === "..."
                    ? "text-gray-500 cursor-default"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                disabled={page === "..."}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 rounded-md ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
