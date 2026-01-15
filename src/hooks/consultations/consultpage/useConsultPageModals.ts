"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProcessedConsultation } from "@/types/consultation";

export function useConsultPageModals() {
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditNotesModal, setOpenEditNotesModal] = useState(false);
  const [openEditContactsModal, setOpenEditContactsModal] = useState(false);

  const [deleteReason, setDeleteReason] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState<ProcessedConsultation | null>(null);
  const [consultationToDelete, setConsultationToDelete] = useState<ProcessedConsultation | null>(null);

  // ESC 키 이벤트
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenAddModal(false);
        setOpenEditModal(false);
        setOpenDeleteModal(false);
        setOpenEditNotesModal(false);
        setOpenEditContactsModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeAllModals = useCallback(() => {
    setOpenAddModal(false);
    setOpenEditModal(false);
    setOpenDeleteModal(false);
    setOpenEditNotesModal(false);
    setOpenEditContactsModal(false);
  }, []);

  const openDeleteWithConsultation = useCallback((consultation: ProcessedConsultation) => {
    setConsultationToDelete(consultation);
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
    openEditNotesModal,
    setOpenEditNotesModal,
    openEditContactsModal,
    setOpenEditContactsModal,

    // 삭제 관련
    deleteReason,
    setDeleteReason,
    consultationToDelete,
    setConsultationToDelete,

    // 선택된 상담
    selectedConsultation,
    setSelectedConsultation,

    // 헬퍼
    closeAllModals,
    openDeleteWithConsultation,
  };
}
