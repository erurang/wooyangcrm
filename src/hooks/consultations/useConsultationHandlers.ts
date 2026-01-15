import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

interface NewConsultation {
  date: string;
  follow_up_date: string;
  contact_name: string;
  user_id: string;
  content: string;
}

interface UseConsultationHandlersProps {
  companyId: string;
  loginUserId: string;
  companyName: string;
  contacts: Contact[];
  addConsultation: (params: ConsultationApiParams) => Promise<ConsultationApiResponse>;
  assignConsultationContact: (params: ConsultationApiParams) => Promise<unknown>;
  updateConsultation: (params: ConsultationApiParams) => Promise<unknown>;
  updateContacts: (contacts: Contact[], companyId: string) => Promise<unknown>;
  refreshConsultations: () => Promise<void>;
  refreshContactsConsultations: () => Promise<void>;
  refreshCompany: () => Promise<void>;
  refreshContacts: () => Promise<void>;
  addFavorite: (userId: string | undefined, companyId: string, name: string | undefined) => Promise<void>;
  removeFavorite: (companyId: string) => Promise<void>;
  refetchFavorites: () => Promise<void>;
}

export function useConsultationHandlers({
  companyId,
  loginUserId,
  companyName,
  contacts,
  addConsultation,
  assignConsultationContact,
  updateConsultation,
  updateContacts,
  refreshConsultations,
  refreshContactsConsultations,
  refreshCompany,
  refreshContacts,
  addFavorite,
  removeFavorite,
  refetchFavorites,
}: UseConsultationHandlersProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");

  const handleContactClick = useCallback(
    (contactId: string) => {
      if (!contactId) {
        setSnackbarMessage("담당자 ID 정보가 없습니다.");
        return;
      }
      router.push(`/manage/contacts/${contactId}`);
    },
    [router]
  );

  const handleAddConsultation = useCallback(
    async (
      newConsultation: NewConsultation,
      isAdding: boolean,
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

      const formattedFollowUpDate = follow_up_date ? follow_up_date : null;

      try {
        setSaving(true);

        const addedConsultation = await addConsultation({
          method: "POST",
          body: {
            date: new Date().toISOString().split("T")[0],
            company_id: companyId,
            content,
            follow_up_date: formattedFollowUpDate,
            user_id,
          },
        });

        if (!addedConsultation?.consultation_id) {
          throw new Error("상담 추가 실패");
        }

        const selectedContact = contacts.find(
          (c) => c.contact_name === contact_name
        );

        if (!selectedContact) {
          throw new Error("담당자 정보를 찾을 수 없습니다.");
        }

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
    },
    [
      companyId,
      contacts,
      addConsultation,
      assignConsultationContact,
      refreshConsultations,
      refreshContactsConsultations,
    ]
  );

  const handleUpdateConsultation = useCallback(
    async (
      newConsultation: NewConsultation,
      selectedConsultationId: string,
      isUpdating: boolean,
      onSuccess: () => void
    ) => {
      if (isUpdating) return;

      const { content, follow_up_date, user_id, contact_name } = newConsultation;

      if (!content || !user_id || !contact_name) {
        setSnackbarMessage("필수 항목을 모두 입력하세요.");
        return;
      }

      const selectedContact = contacts.find(
        (c) => c.contact_name === contact_name
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
    },
    [contacts, updateConsultation, refreshConsultations, refreshContactsConsultations]
  );

  const handleConfirmDelete = useCallback(
    async (consultation: Consultation, deleteReason: string, onSuccess: () => void) => {
      if (!consultation || deleteReason.length === 0) return;

      try {
        setSaving(true);
        const { error } = await supabase.from("deletion_requests").insert([
          {
            related_id: consultation.id,
            status: "pending",
            type: "consultations",
            request_date: new Date(),
            user_id: loginUserId,
            delete_reason: deleteReason,
            content: {
              consultations: `상담삭제 : ${consultation.contact_name} ${consultation.contact_level} ${consultation.content}`,
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
    },
    [loginUserId]
  );

  const handleUpdateNotes = useCallback(
    async (companyDetailId: string, notes: string, onSuccess: () => void) => {
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
    },
    [refreshCompany]
  );

  const handleUpdateContacts = useCallback(
    async (contactsUi: Contact[], originalCompanyId: string, onSuccess: () => void) => {
      setSaving(true);
      try {
        await updateContacts(contactsUi, originalCompanyId);
        await refreshContacts();
        await refreshContactsConsultations();
        setSnackbarMessage("담당자 정보 수정 완료");
        onSuccess();
      } catch {
        setSnackbarMessage("담당자 정보 수정 실패");
      } finally {
        setSaving(false);
      }
    },
    [updateContacts, refreshContacts, refreshContactsConsultations]
  );

  const handleAddFavorite = useCallback(async () => {
    try {
      await addFavorite(loginUserId, companyId, companyName);
      await refetchFavorites();
      setSnackbarMessage("즐겨찾기에 추가되었습니다.");
    } catch (error) {
      console.error("Error adding favorite:", error);
    }
  }, [addFavorite, loginUserId, companyId, companyName, refetchFavorites]);

  const handleRemoveFavorite = useCallback(
    async (companyIdToRemove: string) => {
      try {
        await removeFavorite(companyIdToRemove);
        await refetchFavorites();
        setSnackbarMessage("즐겨찾기가 삭제되었습니다.");
      } catch (error) {
        console.error("Error removing favorite:", error);
      }
    },
    [removeFavorite, refetchFavorites]
  );

  return {
    saving,
    snackbarMessage,
    setSnackbarMessage,
    handleContactClick,
    handleAddConsultation,
    handleUpdateConsultation,
    handleConfirmDelete,
    handleUpdateNotes,
    handleUpdateContacts,
    handleAddFavorite,
    handleRemoveFavorite,
  };
}
