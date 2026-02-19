"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Edit, Trash2, Check, X, Clock, AlertTriangle } from "lucide-react";
import type { Document, AppUser } from "@/types/document";

interface DocumentTableProps {
  documents: Document[];
  type: string;
  user: AppUser;
  handleDocumentNumberClick: (document: Document) => void;
  handleEditModal: (document: Document) => void;
  handleDeleteDocument: (document: Document) => void;
  setStatusChangeDoc: (doc: Document | null) => void;
  setOpenAddModal: (open: boolean) => void;
  getDocumentTypeText: () => string;
  highlightId?: string | null;
}

export default function DocumentTable({
  documents,
  type,
  user,
  handleDocumentNumberClick,
  handleEditModal,
  handleDeleteDocument,
  setStatusChangeDoc,
  setOpenAddModal,
  getDocumentTypeText,
  highlightId,
}: DocumentTableProps) {
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [hasAutoOpenedModal, setHasAutoOpenedModal] = useState(false);

  // 하이라이트된 문서로 스크롤 및 자동 수정 모달 열기 (한 번만)
  useEffect(() => {
    if (highlightId && highlightRef.current && !hasAutoOpenedModal) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      // 하이라이트된 문서 찾아서 수정 모달 열기
      const highlightedDoc = documents.find(doc => doc.id === highlightId);
      if (highlightedDoc && highlightedDoc.user_id === user?.id) {
        setTimeout(() => {
          handleEditModal(highlightedDoc);
          setHasAutoOpenedModal(true);
        }, 500);
      }
    }
  }, [highlightId, documents, user?.id, handleEditModal, hasAutoOpenedModal]);
  // 유효기간까지 남은 일수 계산
  const getDaysUntilExpiry = (validUntil: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(validUntil);
    expiryDate.setHours(0, 0, 0, 0);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 유효기간 경고 스타일
  const getExpiryStyle = (validUntil: string, status: string) => {
    if (status !== "pending") return { className: "", label: null };

    const daysLeft = getDaysUntilExpiry(validUntil);

    if (daysLeft < 0) {
      return {
        className: "text-slate-400 line-through",
        label: (
          <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-slate-200 text-slate-500">
            만료
          </span>
        ),
      };
    }
    if (daysLeft === 0) {
      return {
        className: "text-red-600 font-semibold",
        label: (
          <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700 animate-pulse">
            오늘 만료
          </span>
        ),
      };
    }
    if (daysLeft <= 3) {
      return {
        className: "text-red-600 font-medium",
        label: (
          <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700">
            D-{daysLeft}
          </span>
        ),
      };
    }
    if (daysLeft <= 7) {
      return {
        className: "text-orange-600",
        label: (
          <span className="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">
            D-{daysLeft}
          </span>
        ),
      };
    }
    return { className: "", label: null };
  };

  // 행 배경색 (만료 임박 시 하이라이트)
  const getRowClassName = (document: Document) => {
    if (type !== "estimate" || document.status !== "pending") {
      return "hover:bg-slate-50";
    }
    const validUntil = document.valid_until;
    if (!validUntil) return "hover:bg-slate-50";
    const daysLeft = getDaysUntilExpiry(validUntil);
    if (daysLeft < 0) return "bg-slate-50 opacity-60 hover:bg-slate-100";
    if (daysLeft <= 1) return "bg-red-50 hover:bg-red-100";
    if (daysLeft <= 3) return "bg-orange-50 hover:bg-orange-100";
    return "hover:bg-slate-50";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-sky-100 text-sky-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            진행중
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1">
            <Check className="h-3 w-3" />
            완료
          </span>
        );
      case "canceled":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
            <X className="h-3 w-3" />
            취소
          </span>
        );
      case "expired":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            만료
          </span>
        );
      default:
        return null;
    }
  };

  const getHeaderColumns = () => {
    if (type === "estimate") {
      return (
        <>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            견적일
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            유효기간
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">
            담당자
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">
            견적자
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            견적내용
          </th>
        </>
      );
    }
    if (type === "order") {
      return (
        <>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            발주일
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            납기일
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">
            담당자
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">
            발주자
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            발주내역
          </th>
        </>
      );
    }
    if (type === "requestQuote") {
      return (
        <>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            의뢰일
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            희망견적일
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">
            담당자
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">
            의뢰자
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
            의뢰내역
          </th>
        </>
      );
    }
    return null;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {getHeaderColumns()}
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              총액
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              문서번호
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              상태
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">
              관리
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {documents?.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center">
                  <FileText className="h-12 w-12 text-slate-300 mb-2" />
                  <p>등록된 문서가 없습니다.</p>
                  <button
                    onClick={() => setOpenAddModal(true)}
                    className="mt-3 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium"
                  >
                    {getDocumentTypeText()} 추가하기
                  </button>
                </div>
              </td>
            </tr>
          ) : (
            documents?.map((document) => {
              const validUntil = document.valid_until || "";
              const deliveryDate = document.delivery_date || "";
              const totalAmount = document.total_amount ?? 0;

              const expiryStyle = type === "estimate" && validUntil
                ? getExpiryStyle(validUntil, document.status)
                : { className: "", label: null };

              const isHighlighted = highlightId === document.id;
              return (
              <tr
                key={document.id}
                ref={isHighlighted ? highlightRef : null}
                className={`${isHighlighted ? "bg-amber-50 ring-2 ring-amber-300 ring-inset" : getRowClassName(document)} transition-colors`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                  {document.date}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm ${expiryStyle.className || "text-slate-600"}`}>
                  <span className="flex items-center">
                    {type === "estimate" && validUntil && (
                      <>
                        {new Date(validUntil).toLocaleDateString()}
                        {expiryStyle.label}
                      </>
                    )}
                    {type === "order" && deliveryDate}
                    {type === "requestQuote" && deliveryDate}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell">
                  {document.contact_name} {document.contact_level}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell">
                  {document.user_name} {document.user_level}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  <div className="max-h-24 overflow-y-auto">
                    {document.content.items.map((item, index) => (
                      <div key={index} className="mb-1 last:mb-0">
                        <p className="text-xs">
                          <span className="font-medium">품명:</span> {item.name}
                        </p>
                        <p className="text-xs">
                          <span className="font-medium">규격:</span> {item.spec}
                        </p>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">
                  {totalAmount?.toLocaleString()} 원
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleDocumentNumberClick(document)}
                    className="text-sky-600 hover:text-sky-800 hover:underline font-medium"
                  >
                    {document.document_number}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {document.status === "pending" &&
                  user?.id === document.user_id ? (
                    <button
                      onClick={() => setStatusChangeDoc(document)}
                      className="text-sky-600 hover:text-sky-800 hover:underline text-sm font-medium"
                    >
                      변경
                    </button>
                  ) : (
                    getStatusBadge(document.status)
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                  <div className="flex items-center justify-center space-x-2">
                    {user?.id === document.user_id && (
                      <>
                        {document.status === "pending" && (
                          <button
                            onClick={() => handleEditModal(document)}
                            className="p-1 text-slate-400 hover:text-sky-600 transition-colors"
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDocument(document)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
