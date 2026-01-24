"use client";

import Estimate from "./Estimate";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useSearchParams } from "next/navigation";
import { useLoginUser } from "@/context/login";
import DocumentModal from "@/components/documents/preview/DocumentModal";
import { useContactsByCompany } from "@/hooks/manage/customers/useContactsByCompany";
import { useDocuments } from "@/hooks/documents/useDocumentsList";
import { useAddDocument } from "@/hooks/documents/useAddDocument";
import { useUpdateDocument } from "@/hooks/documents/useUpdateDocument";
import SnackbarComponent from "@/components/Snackbar";
import { useCompanyInfo } from "@/hooks/documents/useCompanyInfo";
import { useUpdateDocumentStatus } from "@/hooks/documents/details/useUpdateDocumentStatus";
import {
  useDocumentItems,
  useDocPageHandlers,
  useDocPageModals,
} from "@/hooks/documents/docpage";
import { DocDeleteModal } from "@/components/documents/docpage";
import { numberToKorean } from "@/lib/numberToKorean";
import { useUsersList } from "@/hooks/useUserList";
import type { Document, Contact, StatusReason } from "@/types/document";

const ESTIMATE_PAYMENT_METHODS = [
  "정기결제",
  "선현금결제",
  "선금50% 납품시50%",
  "협의",
];

const getInitialDocument = (id: string, type?: string) => {
  // 발주서/견적서일 때 기본 납기표시를 "빠른시일내"로, 납기일을 +7일로 설정
  const isOrderOrEstimate = type === "order" || type === "estimate";
  const deliveryDate = isOrderOrEstimate
    ? new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  return {
    id,
    date: new Date().toISOString().split("T")[0],
    company_name: "",
    contact: "",
    phone: "",
    fax: "",
    created_at: new Date().toISOString().split("T")[0],
    valid_until: new Date(new Date().setDate(new Date().getDate() + 30))
      .toISOString()
      .split("T")[0],
    payment_method: "",
    notes: "",
    delivery_term: "",
    delivery_place: "",
    status: "",
    delivery_date: deliveryDate,
    delivery_date_note: isOrderOrEstimate ? "빠른시일내" : "",
  };
};

const DocPage = () => {
  const user = useLoginUser();
  const { type } = useParams();
  const searchParams = useSearchParams();
  const id = searchParams.get("consultId") || "";
  const companyId = searchParams.get("compId") || "";
  const highlightId = searchParams.get("highlight");

  // 문서 상태
  const [newDocument, setNewDocument] = useState(getInitialDocument(id, type as string));

  // 상태 변경 관련
  const [statusChangeDoc, setStatusChangeDoc] = useState<Document | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("completed");
  const [statusReason, setStatusReason] = useState<StatusReason>({
    completed: { reason: "" },
    canceled: { reason: "" },
  });

  // 커스텀 훅 - 아이템 관리
  const {
    items,
    setItems,
    totalAmount,
    koreanAmount,
    addItem,
    removeItem,
    handleQuantityChange,
    handleUnitPriceChange,
    resetItems,
    setItemsFromDocument,
  } = useDocumentItems();

  // 커스텀 훅 - 모달 관리
  const {
    openAddModal,
    setOpenAddModal,
    openEditModal,
    setOpenEditModal,
    openDeleteModal,
    setOpenDeleteModal,
    openModal,
    setOpenModal,
    documentToDelete,
    selectedDocument,
    deleteReason,
    setDeleteReason,
    openViewModal,
    openDeleteModalWithDoc,
  } = useDocPageModals();

  // SWR hooks
  const { contacts } = useContactsByCompany([companyId]);
  const { documents, refreshDocuments } = useDocuments(id, type as string);
  const { company } = useCompanyInfo(companyId);
  const { addDocument, isAdding } = useAddDocument();
  const { updateDocument, isUpdating } = useUpdateDocument();
  const { trigger: updateStatus } = useUpdateDocumentStatus();
  const { users } = useUsersList();

  // 커스텀 훅 - 핸들러
  const {
    saving,
    snackbarMessage,
    setSnackbarMessage,
    handleConfirmDelete,
    handleAddDocument,
    handleEditDocument,
    handleStatusChange,
  } = useDocPageHandlers({
    type: type as string,
    userId: user?.id || "",
    consultationId: id,
    companyId,
    contacts: contacts as { id: string; contact_name: string }[],
    items,
    totalAmount,
    addDocument,
    updateDocument,
    updateStatus,
    refreshDocuments,
    isAdding,
    isUpdating,
  });

  // 문서 데이터 변환
  const transformedDocuments = useMemo(() => {
    return documents.map((document: any) => {
      const userInfo = document.contacts_documents?.[0]?.users || {};
      const contactInfo = document.contacts_documents?.[0]?.contacts || {};
      const companyInfo = document.companies || {};
      return {
        user_name: userInfo.name || "퇴사",
        user_level: userInfo.level || "",
        contact_name: contactInfo.contact_name || "",
        contact_level: contactInfo.level || "",
        contact_mobile: contactInfo.mobile || "",
        company_name: companyInfo.name || "",
        company_phone: companyInfo.phone || "",
        company_fax: companyInfo.fax || "",
        ...document,
        contacts_documents: undefined,
        companies: undefined,
      };
    });
  }, [documents]);

  // 회사 정보 동기화
  useEffect(() => {
    if (company && company.name !== newDocument.company_name) {
      setNewDocument((prev) => ({
        ...prev,
        company_name: company.name,
        phone: company.phone || "",
        fax: company.fax || "",
        delivery_place: "귀사도",
      }));
    }
  }, [company, newDocument.company_name]);

  // 발주서/견적서일 때 기본 납기표시 설정
  useEffect(() => {
    if ((type === "order" || type === "estimate") && !newDocument.delivery_date_note) {
      const deliveryDate = new Date(new Date().setDate(new Date().getDate() + 7))
        .toISOString()
        .split("T")[0];
      setNewDocument((prev) => ({
        ...prev,
        delivery_date_note: "빠른시일내",
        delivery_date: prev.delivery_date || deliveryDate,
      }));
    }
  }, [type]);

  // 수정 모달 열기
  const handleEditModal = (document: Document) => {
    setNewDocument({
      ...newDocument,
      id: document.id,
      date: document.date,
      company_name: company?.name || "",
      contact: document.contact_name,
      created_at: document.created_at.split("T")[0],
      valid_until: document.valid_until || "",
      payment_method: document.payment_method,
      notes: document.notes || "",
      delivery_term: document.delivery_term || "",
      delivery_place: document.delivery_place || "",
      delivery_date: document.delivery_date || "",
      delivery_date_note: document.delivery_date_note || "",
      status: document.status,
    });
    setItemsFromDocument(document.content.items);
    setOpenEditModal(true);
  };

  // 수정 모달 닫기
  const handleEditCloseModal = () => {
    setOpenEditModal(false);
    const isOrderOrEstimate = type === "order" || type === "estimate";
    const deliveryDate = isOrderOrEstimate
      ? new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    setNewDocument({
      ...newDocument,
      delivery_place: "",
      delivery_term: "",
      payment_method: "",
      valid_until: new Date(new Date().setDate(new Date().getDate() + 30))
        .toISOString()
        .split("T")[0],
      contact: "",
      notes: "",
      delivery_date: deliveryDate,
      delivery_date_note: isOrderOrEstimate ? "빠른시일내" : "",
    });
    resetItems();
  };

  // 상태 변경 래퍼
  const onStatusChange = async () => {
    await handleStatusChange(statusChangeDoc, selectedStatus, statusReason, () => {
      setStatusChangeDoc(null);
      setStatusReason({
        completed: { reason: "" },
        canceled: { reason: "" },
      });
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-sm"
    >
      <Estimate
        contacts={contacts as Contact[]}
        saving={saving}
        paymentMethods={ESTIMATE_PAYMENT_METHODS}
        user={user as any}
        users={users}
        type={type as string}
        documents={transformedDocuments}
        handleDocumentNumberClick={openViewModal}
        handleEditModal={handleEditModal}
        handleDeleteDocument={openDeleteModalWithDoc}
        openAddModal={openAddModal}
        newDocument={newDocument}
        setNewDocument={setNewDocument}
        koreanAmount={koreanAmount}
        totalAmount={totalAmount}
        addItem={addItem}
        items={items}
        setItems={setItems}
        handleQuantityChange={handleQuantityChange}
        handleUnitPriceChange={handleUnitPriceChange}
        setOpenAddModal={setOpenAddModal}
        handleAddDocument={() => handleAddDocument(newDocument, () => setOpenAddModal(false))}
        removeItem={removeItem}
        handleEditDocument={() => handleEditDocument(newDocument, () => setOpenEditModal(false))}
        openEditModal={openEditModal}
        setOpenEditModal={setOpenEditModal}
        handleEditCloseModal={handleEditCloseModal}
        statusChangeDoc={statusChangeDoc}
        setStatusChangeDoc={setStatusChangeDoc}
        handleStatusChange={onStatusChange}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        statusReason={statusReason}
        setStatusReason={setStatusReason}
        highlightId={highlightId}
        companyAddress={company?.address || ""}
      />

      <DocDeleteModal
        isOpen={openDeleteModal}
        document={documentToDelete}
        deleteReason={deleteReason}
        onReasonChange={setDeleteReason}
        onConfirm={() => handleConfirmDelete(documentToDelete, deleteReason, () => setOpenDeleteModal(false))}
        onCancel={() => setOpenDeleteModal(false)}
      />

      {openModal && (
        <DocumentModal
          type={type as "estimate" | "order" | "requestQuote"}
          koreanAmount={numberToKorean}
          document={selectedDocument}
          onClose={() => setOpenModal(false)}
          company_fax={selectedDocument?.company_fax || newDocument.fax}
          company_phone={selectedDocument?.company_phone || newDocument.phone}
        />
      )}

      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </motion.div>
  );
};

export default DocPage;
