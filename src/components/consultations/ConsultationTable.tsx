"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Edit, Trash2, FileText, ChevronLeft, ChevronRight, Paperclip } from "lucide-react";
import type { ProcessedConsultation } from "@/types/consultation";
import { CONTACT_METHOD_LABELS, type ContactMethod } from "@/types/consultation";
import EmptyState from "@/components/ui/EmptyState";
import FileAttachmentModal from "./modals/FileAttachmentModal";
import { supabase } from "@/lib/supabaseClient";

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
  highlightId?: string | null;
  onContactClick: (contactId: string) => void;
  onEditConsultation: (consultation: ProcessedConsultation) => void;
  onDeleteConsultation: (consultation: ProcessedConsultation) => void;
  onPageChange: (page: number) => void;
  onAddConsultation?: () => void;
}

export default function ConsultationTable({
  consultations,
  users,
  companyId,
  loginUserId,
  currentPage,
  totalPages,
  searchTerm,
  highlightId,
  onContactClick,
  onEditConsultation,
  onDeleteConsultation,
  onPageChange,
  onAddConsultation,
}: ConsultationTableProps) {
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [selectedConsultationForFile, setSelectedConsultationForFile] = useState<{
    id: string;
    date: string;
  } | null>(null);
  const [fileCounts, setFileCounts] = useState<{ [key: string]: number }>({});

  // 파일 개수 로드
  useEffect(() => {
    const loadFileCounts = async () => {
      if (consultations.length === 0) return;

      const consultationIds = consultations.map((c) => c.id);
      const { data, error } = await supabase
        .from("consultation_files")
        .select("consultation_id")
        .in("consultation_id", consultationIds);

      if (error) {
        console.error("파일 개수 로드 실패:", error.message);
        return;
      }

      // 개수 집계
      const counts: { [key: string]: number } = {};
      data?.forEach((file) => {
        counts[file.consultation_id] = (counts[file.consultation_id] || 0) + 1;
      });
      setFileCounts(counts);
    };

    loadFileCounts();
  }, [consultations]);

  const handleOpenFileModal = (consultationId: string, consultationDate: string) => {
    setSelectedConsultationForFile({ id: consultationId, date: consultationDate });
    setFileModalOpen(true);
  };

  const handleCloseFileModal = () => {
    setFileModalOpen(false);
    setSelectedConsultationForFile(null);
  };

  const handleFileCountChange = (count: number) => {
    if (selectedConsultationForFile) {
      setFileCounts((prev) => ({
        ...prev,
        [selectedConsultationForFile.id]: count,
      }));
    }
  };

  // 하이라이트된 행으로 스크롤
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightId]);

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
              {consultations.map((consultation) => {
                const isHighlighted = highlightId === consultation.id;
                return (
                <tr
                  key={consultation.id}
                  ref={isHighlighted ? highlightRef : null}
                  className={`hover:bg-gray-50 transition-colors ${
                    isHighlighted
                      ? "bg-indigo-50 ring-2 ring-indigo-200 ring-inset"
                      : ""
                  }`}
                >
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
                    {(() => {
                      const consultUser = users.find((u) => u.id === consultation.user_id);
                      if (!consultUser) return null;
                      const userLink = consultation.user_id === loginUserId
                        ? "/profile"
                        : `/profile/${consultation.user_id}`;
                      return (
                        <Link
                          href={userLink}
                          className="text-blue-600 hover:underline"
                        >
                          {consultUser.name} {consultUser.level}
                        </Link>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 sm:w-auto">
                    <div className="max-h-32 overflow-y-auto w-screen md:w-auto">
                      {/* 제목 + 접수경로 (한 줄) */}
                      {(consultation.contact_method || consultation.title) && (
                        <div className="flex items-center gap-2 mb-1">
                          {consultation.title && (
                            <span className="font-semibold text-[15px] text-gray-900 truncate">
                              {consultation.title}
                            </span>
                          )}
                          {consultation.contact_method && (
                            <span className={`inline-block px-2 py-0.5 text-xs rounded-full shrink-0 ${
                              consultation.contact_method === "phone" ? "bg-green-100 text-green-700" :
                              consultation.contact_method === "online" ? "bg-purple-100 text-purple-700" :
                              consultation.contact_method === "email" ? "bg-blue-100 text-blue-700" :
                              consultation.contact_method === "meeting" ? "bg-orange-100 text-orange-700" :
                              consultation.contact_method === "exhibition" ? "bg-pink-100 text-pink-700" :
                              consultation.contact_method === "visit" ? "bg-teal-100 text-teal-700" :
                              consultation.contact_method === "other" ? "bg-gray-100 text-gray-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {CONTACT_METHOD_LABELS[consultation.contact_method as ContactMethod] || consultation.contact_method}
                            </span>
                          )}
                        </div>
                      )}
                      {/* 내용 */}
                      <div className="text-gray-700">
                        {formatContentWithLineBreaks(consultation.content)}
                      </div>
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
                      <button
                        className={`block w-full text-left px-2 py-1 rounded ${
                          fileCounts[consultation.id] > 0
                            ? "text-blue-600 hover:bg-blue-50"
                            : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => handleOpenFileModal(consultation.id, consultation.date)}
                      >
                        <span className="flex items-center">
                          <Paperclip size={14} className="mr-1.5" />
                          첨부파일
                          {fileCounts[consultation.id] > 0 && (
                            <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                              {fileCounts[consultation.id]}
                            </span>
                          )}
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
              );
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState
            type={searchTerm ? "search" : "consultation"}
            onAction={!searchTerm && onAddConsultation ? onAddConsultation : undefined}
          />
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

      {/* File Attachment Modal */}
      {selectedConsultationForFile && (
        <FileAttachmentModal
          isOpen={fileModalOpen}
          onClose={handleCloseFileModal}
          consultationId={selectedConsultationForFile.id}
          userId={loginUserId}
          consultationDate={selectedConsultationForFile.date}
          onFileCountChange={handleFileCountChange}
        />
      )}
    </div>
  );
}
