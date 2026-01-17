"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Edit, Trash2, FileText, ChevronLeft, ChevronRight, Paperclip } from "lucide-react";
import type { ProcessedConsultation } from "@/types/consultation";
import { CONTACT_METHOD_LABELS, type ContactMethod } from "@/types/consultation";
import EmptyState from "@/components/ui/EmptyState";
import FileAttachmentModal from "./modals/FileAttachmentModal";
import DocumentModal from "@/components/documents/preview/DocumentModal";
import { numberToKorean } from "@/lib/numberToKorean";
import { supabase } from "@/lib/supabaseClient";

// 문서 모달용 타입
interface DocumentForModal {
  id: string;
  document_number: string;
  type: string;
  date?: string;
  content?: {
    items?: Array<{
      name: string;
      spec?: string;
      quantity?: number | string;
      unit_price?: number;
      amount?: number;
    }>;
  };
  contact_name?: string;
  contact_level?: string;
  user_name?: string;
  user_level?: string;
  company_name?: string;
  company_phone?: string;
  company_fax?: string;
  notes?: string;
  total_amount?: number;
  valid_until?: string;
  delivery_term?: string;
  delivery_place?: string;
  delivery_date?: string;
  payment_method?: string;
}

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
  isLoading?: boolean;
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
  isLoading,
  onContactClick,
  onEditConsultation,
  onDeleteConsultation,
  onPageChange,
  onAddConsultation,
}: ConsultationTableProps) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [selectedConsultationForFile, setSelectedConsultationForFile] = useState<{
    id: string;
    date: string;
  } | null>(null);
  const [fileCounts, setFileCounts] = useState<{ [key: string]: number }>({});

  // 문서 모달 상태
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentForModal | null>(null);
  const [documentLoading, setDocumentLoading] = useState(false);

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

  // 하이라이트된 카드로 스크롤
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

  // created_at에서 시간 추출 (HH:mm)
  const formatTime = (createdAt?: string) => {
    if (!createdAt) return null;
    try {
      const date = new Date(createdAt);
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return null;
    }
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

  // 새 문서 작성 창 열기
  const openDocumentWindow = (type: string, consultationId: string) => {
    window.open(
      `/documents/${type}?consultId=${consultationId}&compId=${companyId}&fullscreen=true`,
      "_blank",
      "width=1200,height=800,top=100,left=100"
    );
  };

  // 기존 문서 보기 모달 열기
  const openDocumentModal = async (documentId: string) => {
    setDocumentLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`);
      if (!res.ok) throw new Error("문서를 불러올 수 없습니다.");
      const data = await res.json();
      setSelectedDocument(data);
      setDocumentModalOpen(true);
    } catch (error) {
      console.error("문서 로드 실패:", error);
    } finally {
      setDocumentLoading(false);
    }
  };

  const closeDocumentModal = () => {
    setDocumentModalOpen(false);
    setSelectedDocument(null);
  };

  // ESC 키로 문서 모달 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && documentModalOpen) {
        closeDocumentModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [documentModalOpen]);

  // 접수경로 배지 색상
  const getContactMethodStyle = (method: string) => {
    switch (method) {
      case "phone": return "bg-green-100 text-green-700";
      case "online": return "bg-purple-100 text-purple-700";
      case "email": return "bg-blue-100 text-blue-700";
      case "meeting": return "bg-orange-100 text-orange-700";
      case "exhibition": return "bg-pink-100 text-pink-700";
      case "visit": return "bg-teal-100 text-teal-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // 로딩 중일 때 스피너 표시
  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="bg-white rounded-lg border shadow-sm p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 mt-3">상담 내역을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {consultations && consultations.length > 0 ? (
        <div className="space-y-4">
          {consultations.map((consultation) => {
            const isHighlighted = highlightId === consultation.id;
            const consultUser = users.find((u) => u.id === consultation.user_id);
            const userLink = consultation.user_id === loginUserId
              ? "/profile"
              : `/profile/${consultation.user_id}`;
            const isAuthor = loginUserId === consultation.user_id;

            return (
              <div
                key={consultation.id}
                ref={isHighlighted ? highlightRef : null}
                className={`bg-white rounded-lg border shadow-sm overflow-hidden transition-all ${
                  isHighlighted
                    ? "ring-2 ring-indigo-400 bg-indigo-50/30"
                    : "hover:shadow-md"
                }`}
              >
                {/* 카드 본문: a | b 레이아웃 */}
                <div className="flex">
                  {/* 좌측 (a): 날짜, 담당자, 상담자, 접수경로 */}
                  <div className="w-40 shrink-0 bg-gray-50 p-4 border-r flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* 날짜 */}
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">날짜</div>
                        <div className="text-sm font-medium text-gray-900">
                          {consultation.date}
                          {formatTime(consultation.created_at) && (
                            <span className="text-xs text-gray-500 ml-1">
                              {formatTime(consultation.created_at)}
                            </span>
                          )}
                        </div>
                        {consultation.follow_up_date && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            ~ {consultation.follow_up_date}
                          </div>
                        )}
                      </div>

                      {/* 담당자 */}
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">담당자</div>
                        <div
                          className="text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                          onClick={() => onContactClick(consultation.contact_id || "")}
                        >
                          {consultation.contact_name} {consultation.contact_level}
                        </div>
                      </div>

                      {/* 상담자 */}
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">상담자</div>
                        {consultUser ? (
                          <Link href={userLink} className="text-sm text-blue-600 hover:underline">
                            {consultUser.name} {consultUser.level}
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </div>

                    {/* 접수경로 (하단) */}
                    {consultation.contact_method && (
                      <div className="mt-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${getContactMethodStyle(consultation.contact_method)}`}>
                          {CONTACT_METHOD_LABELS[consultation.contact_method as ContactMethod] || consultation.contact_method}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 우측 (b): 제목 + 내용 + 문서버튼 + 관리버튼 */}
                  <div className="flex-1 p-4 flex flex-col">
                    {/* 제목 + 관리 버튼 */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      {consultation.title && (
                        <h3 className="font-semibold text-[15px] text-gray-900">
                          {consultation.title}
                        </h3>
                      )}
                      {isAuthor && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onEditConsultation(consultation)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit size={13} />
                            수정
                          </button>
                          <button
                            onClick={() => onDeleteConsultation(consultation)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={13} />
                            삭제
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 내용 */}
                    <div className="text-sm text-gray-700 leading-relaxed flex-1">
                      {formatContentWithLineBreaks(consultation.content)}
                    </div>

                    {/* 문서 버튼들 (content 아래) */}
                    <div className="flex items-center gap-2 flex-wrap mt-4 pt-3 border-t border-gray-100">
                      {/* 견적서 */}
                      <div className="flex items-center gap-1">
                        <button
                          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                            consultation.documents.estimate
                              ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                          onClick={() => openDocumentWindow("estimate", consultation.id)}
                        >
                          <FileText size={14} />
                          견적서
                        </button>
                        {consultation.rawDocuments
                          ?.filter((doc) => doc.type === "estimate")
                          .map((doc) => (
                            <span
                              key={doc.id}
                              onClick={() => doc.id && openDocumentModal(doc.id)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                            >
                              {doc.document_number || "번호없음"}
                            </span>
                          ))}
                      </div>

                      {/* 발주서 */}
                      <div className="flex items-center gap-1">
                        <button
                          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                            consultation.documents.order
                              ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                          onClick={() => openDocumentWindow("order", consultation.id)}
                        >
                          <FileText size={14} />
                          발주서
                        </button>
                        {consultation.rawDocuments
                          ?.filter((doc) => doc.type === "order")
                          .map((doc) => (
                            <span
                              key={doc.id}
                              onClick={() => doc.id && openDocumentModal(doc.id)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                            >
                              {doc.document_number || "번호없음"}
                            </span>
                          ))}
                      </div>

                      {/* 의뢰서 */}
                      <div className="flex items-center gap-1">
                        <button
                          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                            consultation.documents.requestQuote
                              ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                          onClick={() => openDocumentWindow("requestQuote", consultation.id)}
                        >
                          <FileText size={14} />
                          의뢰서
                        </button>
                        {consultation.rawDocuments
                          ?.filter((doc) => doc.type === "requestQuote")
                          .map((doc) => (
                            <span
                              key={doc.id}
                              onClick={() => doc.id && openDocumentModal(doc.id)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                            >
                              {doc.document_number || "번호없음"}
                            </span>
                          ))}
                      </div>

                      <button
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                          fileCounts[consultation.id] > 0
                            ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                            : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                        onClick={() => handleOpenFileModal(consultation.id, consultation.date)}
                      >
                        <Paperclip size={14} />
                        첨부파일
                        {fileCounts[consultation.id] > 0 && (
                          <span className="ml-0.5 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {fileCounts[consultation.id]}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm">
          <EmptyState
            type={searchTerm ? "search" : "consultation"}
            onAction={!searchTerm && onAddConsultation ? onAddConsultation : undefined}
          />
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center">
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

      {/* Document View Modal */}
      {documentModalOpen && selectedDocument && (
        <DocumentModal
          type={selectedDocument.type}
          koreanAmount={numberToKorean}
          company_phone={selectedDocument.company_phone || ""}
          company_fax={selectedDocument.company_fax || ""}
          document={selectedDocument}
          onClose={closeDocumentModal}
        />
      )}

      {/* Loading overlay */}
      {documentLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-600 mt-2">문서 로딩 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
