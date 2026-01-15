"use client";

import { useState, useEffect, useCallback } from "react";

interface Consultation {
  id: string;
  date: string;
  content: string;
  start_date: string;
  end_date: string;
  participation: "참여" | "주관기관" | "공동연구기관";
  user_id: string;
  total_cost: string;
  gov_contribution: string;
  pri_contribution: string;
  org_id: string;
  rnd_id: string;
}

export function useRndsPageModals() {
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [openConsultationModal, setOpenConsultationModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openNotesModal, setOpenNotesModal] = useState(false);

  const [deleteReason, setDeleteReason] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [consultationToDelete, setConsultationToDelete] = useState<Consultation | null>(null);

  // ESC 키 이벤트
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenConsultationModal(false);
        setOpenDeleteModal(false);
        setOpenNotesModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openAddModal = useCallback(() => {
    setModalMode("add");
    setSelectedConsultation(null);
    setOpenConsultationModal(true);
  }, []);

  const openEditModal = useCallback((consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setModalMode("edit");
    setOpenConsultationModal(true);
  }, []);

  const openDeleteModalWithConsultation = useCallback((consultation: Consultation) => {
    setConsultationToDelete(consultation);
    setDeleteReason("");
    setOpenDeleteModal(true);
  }, []);

  const closeConsultationModal = useCallback(() => {
    setOpenConsultationModal(false);
    setSelectedConsultation(null);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setOpenDeleteModal(false);
    setDeleteReason("");
  }, []);

  return {
    modalMode,
    openConsultationModal,
    setOpenConsultationModal,
    openDeleteModal,
    setOpenDeleteModal,
    openNotesModal,
    setOpenNotesModal,
    deleteReason,
    setDeleteReason,
    selectedConsultation,
    setSelectedConsultation,
    consultationToDelete,
    openAddModal,
    openEditModal,
    openDeleteModalWithConsultation,
    closeConsultationModal,
    closeDeleteModal,
  };
}
