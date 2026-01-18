"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import DocumentModal from "@/components/documents/preview/DocumentModal";
import SnackbarComponent from "@/components/Snackbar";

import {
  DocumentSearchFilters,
  DocumentsTableControls,
  DocumentsTable,
  DocumentsPagination,
  DocumentStatusChangeModal,
} from "@/components/documents/details";

import { useUsersList } from "@/hooks/useUserList";
import { useDocumentsStatusList } from "@/hooks/documents/details/useDocumentsStatusList";
import { useUpdateDocumentStatus } from "@/hooks/documents/details/useUpdateDocumentStatus";
import { useDocumentDetailsFilters } from "@/hooks/documents/details/useDocumentDetailsFilters";
import { useLoginUser } from "@/context/login";
import { numberToKorean } from "@/utils/numberToKorean";

interface DocumentItem {
  name: string;
  spec?: string;
  quantity?: number | string;
  unit_price?: number;
  amount?: number;
}

interface Document {
  companies?: {
    phone?: string;
    fax?: string;
  };
  id: string;
  type: string;
  status: "pending" | "completed" | "canceled" | "expired";
  document_number: string;
  contact_name: string;
  contact_level: string;
  user_name: string;
  user_level: string;
  date: string;
  content: {
    items?: DocumentItem[];
  };
  created_at: string;
  user_id: string;
  status_reason: {
    canceled: { reason: string; amount: number };
    completed: { reason: string; amount: number };
  };
  consultation_id: string;
  company_id: string;
  // 분리된 컬럼들
  company_name: string;
  company_phone?: string;
  company_fax?: string;
  valid_until: string | null;
  delivery_date: string | null;
  total_amount: number;
}

export default function DocumentsDetailsPage() {
  const loginUser = useLoginUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "estimate";
  const highlightId = searchParams.get("highlight");

  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [statusChangeDoc, setStatusChangeDoc] = useState<Document | null>(null);
  const [statusReason, setStatusReason] = useState({
    canceled: { reason: "", amount: 0 },
    completed: { reason: "", amount: 0 },
  });
  const [changedStatus, setChangedStatus] = useState("");

  // Users list
  const { users } = useUsersList();

  // Filter hook
  const { filters, debounced, handlers } = useDocumentDetailsFilters({
    type,
    users,
  });

  // Documents data
  const {
    documents,
    total,
    refreshDocuments,
    isLoading: isDocumentsLoading,
  } = useDocumentsStatusList({
    userId: filters.selectedUser?.id as string,
    type,
    status: filters.selectedStatus,
    docNumber: debounced.docNumber,
    page: filters.currentPage,
    limit: filters.documentsPerPage,
    companyIds: debounced.companyIds,
    notes: debounced.notes,
    documentId: highlightId, // 특정 문서 하이라이트용
  });

  const { trigger: updateStatus, isMutating } = useUpdateDocumentStatus();
  const totalPages = Math.ceil(total / filters.documentsPerPage);

  // Effects
  useEffect(() => {
    refreshDocuments();
  }, [filters.selectedUser]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedDocument(null);
        setStatusChangeDoc(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handlers
  const handleStatusChange = async () => {
    if (!statusChangeDoc || !changedStatus) return;
    if (isMutating) return;

    if (
      !statusReason[changedStatus as "canceled" | "completed"].reason.trim()
    ) {
      return;
    }

    const confirmChange = window.confirm(
      "상태 변경은 되돌릴 수 없습니다. 변경할까요?"
    );
    if (!confirmChange) return;

    try {
      const reason = {
        [changedStatus]: {
          reason:
            statusReason[changedStatus as "canceled" | "completed"].reason,
        },
      };

      await updateStatus({
        id: statusChangeDoc.id,
        status: changedStatus,
        status_reason: reason,
        updated_by: loginUser?.id, // 알림 전송용
      });

      handlers.onPageChange(1);
      setStatusChangeDoc(null);
      setStatusReason({
        canceled: { reason: "", amount: 0 },
        completed: { reason: "", amount: 0 },
      });
      await refreshDocuments();
    } catch (error) {
      console.error("문서 상태 업데이트 실패:", error);
    }
  };

  const handleStatusReasonChange = (
    status: "canceled" | "completed",
    reason: string
  ) => {
    setStatusReason((prev) => ({
      ...prev,
      [status]: { ...prev[status], reason },
    }));
  };

  const handleTableStatusChange = (doc: Document, status: string) => {
    setChangedStatus(status);
    setStatusChangeDoc(doc);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-sm text-slate-800">
      {/* 검색 필터 */}
      <DocumentSearchFilters
        searchTerm={filters.searchTerm}
        searchDocNumber={filters.searchDocNumber}
        searchNotes={filters.searchNotes}
        selectedStatus={filters.selectedStatus}
        selectedUser={filters.selectedUser}
        users={users}
        onSearchTermChange={handlers.onSearchTermChange}
        onDocNumberChange={handlers.onDocNumberChange}
        onNotesChange={handlers.onNotesChange}
        onStatusChange={handlers.onStatusChange}
        onUserChange={handlers.onUserChange}
      />

      {/* 테이블 컨트롤 */}
      <DocumentsTableControls
        total={total}
        isLoading={isDocumentsLoading}
        documentsPerPage={filters.documentsPerPage}
        onPerPageChange={handlers.onPerPageChange}
        onResetFilters={handlers.onResetFilters}
      />

      {/* 문서 목록 테이블 */}
      <DocumentsTable
        documents={documents}
        type={type}
        loginUserId={loginUser?.id}
        isLoading={isDocumentsLoading}
        highlightId={highlightId}
        onDocumentClick={setSelectedDocument}
        onCompanyClick={(companyId) =>
          router.push(`/consultations/${companyId}`)
        }
        onStatusChange={handleTableStatusChange}
      />

      {/* 페이지네이션 */}
      <DocumentsPagination
        currentPage={filters.currentPage}
        totalPages={totalPages}
        onPageChange={handlers.onPageChange}
      />

      {/* 문서 상세 모달 */}
      <AnimatePresence>
        {selectedDocument && (
          <motion.div
            className="fixed inset-0 z-[1000] overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-black/50"></div>
            </div>

            <div className="relative z-[1001] flex items-center justify-center min-h-screen">
              <DocumentModal
                koreanAmount={numberToKorean}
                document={selectedDocument}
                onClose={() => setSelectedDocument(null)}
                company_phone={selectedDocument.company_phone || selectedDocument.companies?.phone || ""}
                company_fax={selectedDocument.company_fax || selectedDocument.companies?.fax || ""}
                type={selectedDocument.type}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 상태 변경 모달 */}
      <DocumentStatusChangeModal
        isOpen={!!statusChangeDoc}
        document={statusChangeDoc}
        changedStatus={changedStatus}
        statusReason={statusReason}
        isMutating={isMutating}
        onStatusReasonChange={handleStatusReasonChange}
        onConfirm={handleStatusChange}
        onClose={() => setStatusChangeDoc(null)}
      />

      {/* 스낵바 */}
      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
