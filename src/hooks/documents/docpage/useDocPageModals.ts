"use client";

import { useState, useEffect, useCallback } from "react";
import type { Document } from "@/types/document";

export function useDocPageModals() {
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  // ESC 키 이벤트
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenModal(false);
        setOpenAddModal(false);
        setOpenEditModal(false);
        setOpenDeleteModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeAllModals = useCallback(() => {
    setOpenModal(false);
    setOpenAddModal(false);
    setOpenEditModal(false);
    setOpenDeleteModal(false);
  }, []);

  const openViewModal = useCallback((document: Document) => {
    setSelectedDocument(document);
    setOpenModal(true);
  }, []);

  const openDeleteModalWithDoc = useCallback((document: Document) => {
    setDocumentToDelete(document);
    setDeleteReason("");
    setOpenDeleteModal(true);
  }, []);

  return {
    // 모달 상태
    openAddModal,
    setOpenAddModal,
    openEditModal,
    setOpenEditModal,
    openDeleteModal,
    setOpenDeleteModal,
    openModal,
    setOpenModal,

    // 문서 상태
    documentToDelete,
    setDocumentToDelete,
    selectedDocument,
    setSelectedDocument,
    deleteReason,
    setDeleteReason,

    // 헬퍼 함수
    closeAllModals,
    openViewModal,
    openDeleteModalWithDoc,
  };
}
