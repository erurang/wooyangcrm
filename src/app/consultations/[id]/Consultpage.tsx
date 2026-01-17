"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLoginUser } from "@/context/login";
import SnackbarComponent from "@/components/Snackbar";

import { useFavorites } from "@/hooks/favorites/useFavorites";
import { useConsultationsList } from "@/hooks/consultations/useConsultationsList";
import { useCompanyDetails } from "@/hooks/consultations/useCompanyDetails";
import { useContactsByCompany } from "@/hooks/manage/customers/useContactsByCompany";
import { useConsultationContacts } from "@/hooks/consultations/useConsultationContacts";
import { useUsersList } from "@/hooks/useUserList";
import { useAddConsultation } from "@/hooks/consultations/useAddConsultation";
import { useAssignConsultationContact } from "@/hooks/consultations/useAssignConsultationContact";
import { useUpdateConsultation } from "@/hooks/consultations/useUpdateConsultation";
import { useUpdateContacts } from "@/hooks/manage/customers/useUpdateContacts";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useConsultPageModals,
  useConsultPageHandlers,
} from "@/hooks/consultations/consultpage";

import { ConsultPageHeader } from "@/components/consultations/detail";
import {
  CompanyInfoCard,
  ConsultationTable,
  ConsultationFormModal,
  DeleteConfirmModal,
  NotesEditModal,
  ContactsEditModal,
} from "@/components/consultations";
import type {
  BaseConsultation,
  ConsultationContactRelation,
  ProcessedConsultation,
  ContactMethod,
} from "@/types/consultation";

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

export default function ConsultationPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";
  const router = useRouter();
  const loginUser = useLoginUser();
  const searchParams = useSearchParams();

  // URL 파라미터 (highlight)
  const highlightId = searchParams.get("highlight");

  // 검색 및 페이지네이션
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

  // 폼 상태
  const [newConsultation, setNewConsultation] = useState<{
    date: string;
    follow_up_date: string;
    contact_name: string;
    user_id: string;
    title: string;
    content: string;
    contact_method: ContactMethod;
  }>({
    date: new Date().toISOString().split("T")[0],
    follow_up_date: "",
    contact_name: "",
    user_id: "",
    title: "",
    content: "",
    contact_method: "email",
  });

  // SWR Hooks
  const { users } = useUsersList();
  const { favorites, removeFavorite, refetchFavorites, addFavorite } =
    useFavorites(loginUser?.id);
  const { consultations, totalPages, actualPage, refreshConsultations } =
    useConsultationsList(id as string, currentPage, debouncedSearchTerm, highlightId);

  // 실제 페이지가 요청한 페이지와 다르면 (highlightId로 인해) 상태 동기화
  useEffect(() => {
    if (actualPage && actualPage !== currentPage && highlightId) {
      setCurrentPage(actualPage);
      router.replace(`/consultations/${id}?page=${actualPage}&highlight=${highlightId}`, { scroll: false });
    }
  }, [actualPage, currentPage, highlightId, id, router]);
  const {
    companyDetail,
    isLoading: isCompanyDetailLoading,
    refreshCompany,
  } = useCompanyDetails(id as string);
  const { contacts, refreshContacts } = useContactsByCompany([id] as string[]);
  const consultationIds = consultations?.map((con: BaseConsultation) => con.id) || [];
  const { contactsConsultations, refreshContactsConsultations } =
    useConsultationContacts(consultationIds);
  const { addConsultation, isAdding } = useAddConsultation();
  const { assignConsultationContact } = useAssignConsultationContact();
  const { updateConsultation, isUpdating } = useUpdateConsultation();
  const { updateContacts } = useUpdateContacts();

  // 커스텀 훅 - 모달 관리
  const {
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
    deleteReason,
    setDeleteReason,
    consultationToDelete,
    selectedConsultation,
    setSelectedConsultation,
    openDeleteWithConsultation,
  } = useConsultPageModals();

  // 커스텀 훅 - 핸들러
  const {
    saving,
    snackbarMessage,
    setSnackbarMessage,
    handleContactClick,
    handleUpdateNotes,
    handleAddConsultation,
    handleUpdateConsultation,
    handleConfirmDelete,
    handleUpdateContacts,
  } = useConsultPageHandlers({
    companyId: id as string,
    loginUserId: loginUser?.id || "",
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
  });

  // 로컬 상태
  const [notes, setNotes] = useState(companyDetail?.notes || "");
  const [contactsUi, setContactsUi] = useState<Contact[]>(contacts ?? []);

  // 처리된 상담 데이터
  const processedConsultations: ProcessedConsultation[] = useMemo(() => {
    return consultations?.map((consultation: BaseConsultation) => {
      const contactRelation = (contactsConsultations as ConsultationContactRelation[]).find(
        (cc) => cc.consultation_id === consultation.id
      );
      const firstContact = contactRelation?.contacts || {} as Partial<Contact>;

      const documentTypes = {
        estimate: false,
        order: false,
        requestQuote: false,
      };

      consultation.documents?.forEach((doc: { type: string }) => {
        if (doc.type === "estimate") documentTypes.estimate = true;
        if (doc.type === "order") documentTypes.order = true;
        if (doc.type === "requestQuote") documentTypes.requestQuote = true;
      });

      return {
        ...consultation,
        contact_name: firstContact.contact_name || "",
        contact_level: firstContact.level || "",
        contact_email: firstContact.email || "",
        contact_mobile: firstContact.mobile || "",
        contact_id: firstContact.id || "",
        documents: documentTypes,
      };
    });
  }, [consultations, contactsConsultations]);

  // 수정 모달 열기
  const handleEditConsultation = (consultation: ProcessedConsultation) => {
    setSelectedConsultation(consultation);
    setNewConsultation({
      date: consultation.date,
      follow_up_date: consultation.follow_up_date ?? "",
      user_id: consultation.user_id,
      title: consultation.title ?? "",
      content: consultation.content,
      contact_name: consultation.contact_name ?? "",
      contact_method: consultation.contact_method ?? "phone",
    });
    setOpenEditModal(true);
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      router.push(`/consultations/${id}?page=${page}`, { scroll: false });
    }
  };

  // 즐겨찾기 핸들러
  const handleAddFavorite = async () => {
    if (!loginUser?.id || !companyDetail?.name) return;
    try {
      await addFavorite(loginUser.id, id, companyDetail.name);
      await refetchFavorites();
      setSnackbarMessage("즐겨찾기에 추가되었습니다.");
    } catch (error) {
      console.error("Error adding favorite:", error);
    }
  };

  const handleRemoveFavorite = async (companyId: string) => {
    try {
      await removeFavorite(companyId);
      await refetchFavorites();
      setSnackbarMessage("즐겨찾기가 삭제되었습니다.");
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  // Effects
  useEffect(() => {
    if (contacts && JSON.stringify(contactsUi) !== JSON.stringify(contacts)) {
      setContactsUi(contacts);
    }
  }, [contacts]);

  useEffect(() => {
    const defaultContactName =
      contacts.length > 0 ? contacts[0].contact_name : newConsultation.contact_name;
    const defaultUserId = loginUser?.id ?? newConsultation.user_id;
    if (
      newConsultation.contact_name !== defaultContactName ||
      newConsultation.user_id !== defaultUserId
    ) {
      setNewConsultation((prev) => ({
        ...prev,
        contact_name: defaultContactName,
        user_id: defaultUserId,
      }));
    }
  }, [contacts, loginUser]);

  // URL 파라미터 처리 (page)
  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam) setCurrentPage(Number(pageParam));
  }, [searchParams]);

  return (
    <div className="bg-white text-gray-800 min-h-screen">
      <ConsultPageHeader
        companyName={companyDetail?.name || ""}
        companyId={companyDetail?.id || ""}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={() => setOpenAddModal(true)}
        favorites={favorites}
        onAddFavorite={handleAddFavorite}
        onRemoveFavorite={handleRemoveFavorite}
      />

      <div className="p-4">
        <CompanyInfoCard
          companyDetail={companyDetail}
          contacts={contacts}
          isLoading={isCompanyDetailLoading}
          onEditNotes={() => setOpenEditNotesModal(true)}
          onEditContacts={() => setOpenEditContactsModal(true)}
        />

        <ConsultationTable
          consultations={processedConsultations || []}
          users={users}
          companyId={companyDetail?.id || ""}
          loginUserId={loginUser?.id || ""}
          currentPage={currentPage}
          totalPages={totalPages}
          searchTerm={debouncedSearchTerm}
          highlightId={highlightId}
          onContactClick={handleContactClick}
          onEditConsultation={handleEditConsultation}
          onDeleteConsultation={openDeleteWithConsultation}
          onPageChange={handlePageChange}
        />
      </div>

      <ConsultationFormModal
        mode="add"
        isOpen={openAddModal}
        onClose={() => setOpenAddModal(false)}
        formData={newConsultation}
        setFormData={setNewConsultation}
        contacts={contacts}
        users={users}
        onSubmit={() => handleAddConsultation(newConsultation, () => setOpenAddModal(false))}
        saving={saving}
      />

      <ConsultationFormModal
        mode="edit"
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
        formData={newConsultation}
        setFormData={setNewConsultation}
        contacts={contacts}
        users={users}
        onSubmit={() => handleUpdateConsultation(selectedConsultation?.id, newConsultation, () => setOpenEditModal(false))}
        saving={saving}
      />

      <DeleteConfirmModal
        isOpen={openDeleteModal && !!consultationToDelete}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={() => handleConfirmDelete(consultationToDelete, deleteReason, () => setOpenDeleteModal(false))}
        deleteReason={deleteReason}
        setDeleteReason={setDeleteReason}
        saving={saving}
      />

      <NotesEditModal
        isOpen={openEditNotesModal}
        onClose={() => setOpenEditNotesModal(false)}
        notes={notes}
        setNotes={setNotes}
        onSave={() => handleUpdateNotes(companyDetail?.id, notes, () => setOpenEditNotesModal(false))}
        saving={saving}
      />

      <ContactsEditModal
        isOpen={openEditContactsModal}
        onClose={() => setOpenEditContactsModal(false)}
        contacts={contactsUi}
        setContacts={setContactsUi}
        originalContacts={contacts}
        onSave={() => handleUpdateContacts(contactsUi, contacts[0]?.company_id, () => setOpenEditContactsModal(false))}
        saving={saving}
      />

      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
