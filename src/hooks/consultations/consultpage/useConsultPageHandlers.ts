"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Consultation {
  id: string;
  date: string;
  content: string;
  follow_up_date: string | null;
  user_id: string;
  contact_name: string;
  contact_level: string;
  contact_id?: string;
}

interface ConsultationApiParams {
  method: string;
  body: Record<string, unknown>;
}

interface ConsultationApiResponse {
  consultation_id?: string;
  [key: string]: unknown;
}

interface Contact {
  id: string;
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
  resign: boolean;
  sort_order: null | number;
  company_id?: string;
}

interface NewConsultation {
  date: string;
  follow_up_date: string;
  contact_name: string;
  user_id: string;
  content: string;
}

interface UseConsultPageHandlersProps {
  companyId: string;
  loginUserId: string;
  contacts: Contact[];
  addConsultation: (params: ConsultationApiParams) => Promise<ConsultationApiResponse>;
  assignConsultationContact: (params: ConsultationApiParams) => Promise<unknown>;
  updateConsultation: (params: ConsultationApiParams) => Promise<unknown>;
  updateContacts: (contacts: Contact[], companyId: string) => Promise<unknown>;
  refreshConsultations: () => Promise<void>;
  refreshContactsConsultations: () => Promise<void>;
  refreshCompany: () => Promise<void>;
  refreshContacts: () => Promise<void>;
  isAdding: boolean;
  isUpdating: boolean;
}

export function useConsultPageHandlers({
  companyId,
  loginUserId,
  contacts,
  addConsultation,
  assignConsultationContact,
  updateConsultation,
  updateContacts,
  refreshConsultations,
  refreshContactsConsultations,
  refreshCompany,
  refreshContacts,
  isAdding,
  isUpdating,
}: UseConsultPageHandlersProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // 담당자 클릭
  const handleContactClick = useCallback((contactId: string) => {
    if (!contactId) {
      setSnackbarMessage("담당자 ID 정보가 없습니다.");
      return;
    }
    router.push(`/manage/contacts/${contactId}`);
  }, [router]);

  // 비고 수정
  const handleUpdateNotes = useCallback(async (
    companyDetailId: string | undefined,
    notes: string,
    onSuccess: () => void
  ) => {
    if (!companyDetailId) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("companies")
        .update({ notes })
        .eq("id", companyDetailId);
      await refreshCompany();
      if (error) {
        setSnackbarMessage("비고 수정 실패");
      } else {
        setSnackbarMessage("비고 수정 완료");
        onSuccess();
      }
    } catch {
      setSnackbarMessage("비고 수정 중 오류 발생");
    } finally {
      setSaving(false);
    }
  }, [refreshCompany]);

  // 상담 추가
  const handleAddConsultation = useCallback(async (
    newConsultation: NewConsultation,
    onSuccess: () => void
  ) => {
    if (isAdding) return;
    const { content, follow_up_date, user_id, contact_name } = newConsultation;

    if (!content) {
      setSnackbarMessage("상담 내용을 입력하세요.");
      return;
    }
    if (!contact_name) {
      setSnackbarMessage("담당자를 선택해주세요.");
      return;
    }

    try {
      setSaving(true);
      const addedConsultation = await addConsultation({
        method: "POST",
        body: {
          date: new Date().toISOString().split("T")[0],
          company_id: companyId,
          content,
          follow_up_date: follow_up_date || null,
          user_id,
        },
      });

      if (!addedConsultation?.consultation_id) throw new Error("상담 추가 실패");

      const selectedContact = contacts.find(
        (c: Contact) => c.contact_name === contact_name
      );
      if (!selectedContact) throw new Error("담당자 정보를 찾을 수 없습니다.");

      await assignConsultationContact({
        method: "POST",
        body: {
          consultation_id: addedConsultation.consultation_id,
          contact_id: selectedContact.id,
          user_id,
        },
      });

      setSnackbarMessage("상담 내역 추가 완료");
      onSuccess();
      await refreshConsultations();
      await refreshContactsConsultations();
    } catch {
      setSnackbarMessage("상담 내역 추가 중 오류 발생");
    } finally {
      setSaving(false);
    }
  }, [isAdding, companyId, contacts, addConsultation, assignConsultationContact, refreshConsultations, refreshContactsConsultations]);

  // 상담 수정
  const handleUpdateConsultation = useCallback(async (
    selectedConsultationId: string | undefined,
    newConsultation: NewConsultation,
    onSuccess: () => void
  ) => {
    if (isUpdating) return;
    const { content, follow_up_date, user_id, contact_name } = newConsultation;

    if (!content || !user_id || !contact_name) {
      setSnackbarMessage("필수 항목을 모두 입력하세요.");
      return;
    }

    const selectedContact = contacts.find(
      (c: Contact) => c.contact_name === contact_name
    );
    if (!selectedContact) {
      setSnackbarMessage("담당자를 찾을 수 없습니다.");
      return;
    }

    try {
      setSaving(true);
      await updateConsultation({
        method: "PATCH",
        body: {
          consultation_id: selectedConsultationId,
          content,
          follow_up_date,
          user_id,
          contact_id: selectedContact.id,
        },
      });

      setSnackbarMessage("상담 내역 수정 완료");
      onSuccess();
      await refreshConsultations();
      await refreshContactsConsultations();
    } catch {
      setSnackbarMessage("상담 내역 수정 중 오류 발생");
    } finally {
      setSaving(false);
    }
  }, [isUpdating, contacts, updateConsultation, refreshConsultations, refreshContactsConsultations]);

  // 삭제 요청
  const handleConfirmDelete = useCallback(async (
    consultationToDelete: Consultation | null,
    deleteReason: string,
    onSuccess: () => void
  ) => {
    if (!consultationToDelete || deleteReason.length === 0) return;

    try {
      setSaving(true);
      const { error } = await supabase.from("deletion_requests").insert([
        {
          related_id: consultationToDelete.id,
          status: "pending",
          type: "consultations",
          request_date: new Date(),
          user_id: loginUserId,
          delete_reason: deleteReason,
          content: {
            consultations: `상담삭제 : ${consultationToDelete.contact_name} ${consultationToDelete.contact_level} ${consultationToDelete.content}`,
          },
        },
      ]);

      if (error) {
        setSnackbarMessage("삭제 요청을 생성하는 데 실패했습니다.");
      } else {
        setSnackbarMessage("삭제 요청이 생성되었습니다.");
        onSuccess();
      }
    } catch {
      setSnackbarMessage("삭제 요청 생성 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }, [loginUserId]);

  // 담당자 수정
  const handleUpdateContacts = useCallback(async (
    contactsUi: Contact[],
    originalCompanyId: string,
    onSuccess: () => void
  ) => {
    setSaving(true);
    try {
      await updateContacts(contactsUi, originalCompanyId);
      await refreshContacts();
      await refreshContactsConsultations();
      setSnackbarMessage("담당자 정보 수정 완료");
      onSuccess();
    } catch (error) {
      console.error("Error updating contacts:", error);
      setSnackbarMessage("담당자 정보 수정 실패");
    } finally {
      setSaving(false);
    }
  }, [updateContacts, refreshContacts, refreshContactsConsultations]);

  return {
    saving,
    snackbarMessage,
    setSnackbarMessage,
    handleContactClick,
    handleUpdateNotes,
    handleAddConsultation,
    handleUpdateConsultation,
    handleConfirmDelete,
    handleUpdateContacts,
  };
}
