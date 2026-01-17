"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MessageSquare, Paperclip, FileText } from "lucide-react";
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
import { useUpdateCompany } from "@/hooks/manage/customers/useUpdateCompany";
import { useDebounce } from "@/hooks/useDebounce";
import { useBroadcastChannel } from "@/hooks/useBroadcastChannel";
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
  CompanyEditModal,
} from "@/components/consultations";
import { CompanyFilesTab, CompanyPostsTab } from "@/components/consultations/tabs";
import type {
  BaseConsultation,
  ConsultationContactRelation,
  ProcessedConsultation,
  ContactMethod,
} from "@/types/consultation";

type TabType = "consultations" | "files" | "posts";

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

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>("consultations");

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
  const { consultations, totalPages, actualPage, refreshConsultations, isLoading: isConsultationsLoading } =
    useConsultationsList(id as string, currentPage, debouncedSearchTerm, highlightId);

  // 다른 탭/창에서 문서가 생성/수정/상태변경되면 상담 목록 새로고침
  useBroadcastChannel({
    companyId: id,
    messageTypes: ["DOCUMENT_CREATED", "DOCUMENT_UPDATED", "DOCUMENT_STATUS_CHANGED"],
    onMessage: useCallback(() => {
      refreshConsultations();
    }, [refreshConsultations]),
  });

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
  const { updateCompany, isLoading: isCompanyUpdating } = useUpdateCompany();

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
  const [openEditCompanyModal, setOpenEditCompanyModal] = useState(false);
  const [companySaving, setCompanySaving] = useState(false);

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
        rawDocuments: consultation.documents || [],
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

  // 비고 수정 모달 열릴 때 기존값으로 초기화
  useEffect(() => {
    if (openEditNotesModal && companyDetail?.notes !== undefined) {
      setNotes(companyDetail.notes || "");
    }
  }, [openEditNotesModal, companyDetail?.notes]);

  // 거래처 정보 수정 핸들러
  const handleSaveCompany = async (data: {
    id: string;
    name: string;
    address: string;
    phone: string;
    fax: string;
    parcel?: string;
    email?: string;
  }) => {
    setCompanySaving(true);
    try {
      await updateCompany({
        id: data.id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        fax: data.fax,
        parcel: data.parcel,
        email: data.email,
      });
      await refreshCompany();
      setOpenEditCompanyModal(false);
      setSnackbarMessage("거래처 정보가 수정되었습니다.");
    } catch (error) {
      console.error("Error updating company:", error);
      setSnackbarMessage("거래처 정보 수정에 실패했습니다.");
    } finally {
      setCompanySaving(false);
    }
  };

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
          onEditCompany={() => setOpenEditCompanyModal(true)}
        />

        {/* 탭 네비게이션 */}
        <div className="mb-4 border-b border-gray-200">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab("consultations")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "consultations"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <MessageSquare size={16} />
              상담
            </button>
            <button
              onClick={() => setActiveTab("files")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "files"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Paperclip size={16} />
              파일
            </button>
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "posts"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FileText size={16} />
              게시글
            </button>
          </nav>
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === "consultations" && (
          <ConsultationTable
            consultations={processedConsultations || []}
            users={users}
            companyId={companyDetail?.id || ""}
            loginUserId={loginUser?.id || ""}
            currentPage={currentPage}
            totalPages={totalPages}
            searchTerm={debouncedSearchTerm}
            highlightId={highlightId}
            isLoading={isConsultationsLoading}
            onContactClick={handleContactClick}
            onEditConsultation={handleEditConsultation}
            onDeleteConsultation={openDeleteWithConsultation}
            onPageChange={handlePageChange}
          />
        )}

        {activeTab === "files" && companyDetail?.id && (
          <CompanyFilesTab companyId={companyDetail.id} />
        )}

        {activeTab === "posts" && companyDetail?.id && (
          <CompanyPostsTab companyId={companyDetail.id} />
        )}
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

      <CompanyEditModal
        isOpen={openEditCompanyModal}
        onClose={() => setOpenEditCompanyModal(false)}
        companyData={companyDetail ? {
          id: companyDetail.id,
          name: companyDetail.name,
          address: companyDetail.address || "",
          phone: companyDetail.phone || "",
          fax: companyDetail.fax || "",
          parcel: companyDetail.parcel || "",
          email: companyDetail.email || "",
        } : null}
        onSave={handleSaveCompany}
        saving={companySaving}
      />

      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
