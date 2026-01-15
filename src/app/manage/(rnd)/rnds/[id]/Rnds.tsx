"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLoginUser } from "@/context/login";
import SnackbarComponent from "@/components/Snackbar";

import { useUsersList } from "@/hooks/useUserList";
import { useRnDsDetails } from "@/hooks/manage/(rnds)/rnds/useRnDsDetail";
import { useRndConsultationsList } from "@/hooks/manage/(rnds)/consultations/useRndConsultationsList";
import { useDebounce } from "@/hooks/useDebounce";
import { useAddRndConsultation } from "@/hooks/manage/(rnds)/consultations/useAddRndConsultation";
import { useUpdateRnDsConsultations } from "@/hooks/manage/(rnds)/consultations/useUpdateRnDsConsultations";
import {
  useRndsPageModals,
  useRndsPageHandlers,
} from "@/hooks/manage/rnds/rndpage";

import {
  RnDInfoCard,
  RnDNotesCard,
  RnDActionBar,
  RnDConsultationModal,
  RnDConsultationsTable,
  RnDDeleteModal,
  RnDNotesModal,
} from "@/components/manage/rnds/detail";

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

const RND_PARTICIPATION_TYPES = ["주관기관", "공동연구기관", "참여"];

const getInitialConsultation = (loginUserId: string, rndId: string | string[]) => ({
  date: new Date().toISOString().split("T")[0],
  content: "",
  start_date: "",
  end_date: "",
  participation: "",
  user_id: loginUserId || "",
  total_cost: "",
  gov_contribution: "",
  pri_contribution: "",
  org_id: "",
  rnd_id: rndId,
});

export default function RnDsPage() {
  const { id } = useParams();
  const router = useRouter();
  const loginUser = useLoginUser();
  const searchParams = useSearchParams();

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);

  // Form state
  const [newConsultation, setNewConsultation] = useState(
    getInitialConsultation(loginUser?.id || "", id as string)
  );
  const [notes, setNotes] = useState("");

  // SWR hooks
  const { users } = useUsersList();
  const { consultations, totalPages, refreshConsultations } = useRndConsultationsList(
    id as string,
    currentPage,
    debouncedSearchTerm
  );
  const { addConsultation, isAdding } = useAddRndConsultation();
  const { updateRndsConsultations, isUpdating } = useUpdateRnDsConsultations();
  const { rndsDetail, rnDsDetailLoading, refreshRnds } = useRnDsDetails(id as string);

  // 커스텀 훅 - 모달 관리
  const {
    modalMode,
    openConsultationModal,
    openDeleteModal,
    openNotesModal,
    setOpenNotesModal,
    deleteReason,
    setDeleteReason,
    selectedConsultation,
    consultationToDelete,
    openAddModal,
    openEditModal,
    openDeleteModalWithConsultation,
    closeConsultationModal,
    closeDeleteModal,
  } = useRndsPageModals();

  // 커스텀 훅 - 핸들러
  const {
    saving,
    snackbarMessage,
    setSnackbarMessage,
    handleAddConsultation,
    handleUpdateConsultation,
    handleConfirmDelete,
    handleUpdateNotes,
  } = useRndsPageHandlers({
    rndId: id as string,
    loginUserId: loginUser?.id || "",
    rndsDetail,
    addConsultation,
    updateRndsConsultations,
    refreshConsultations,
    refreshRnds,
    isAdding,
    isUpdating,
  });

  // Sync notes with rndsDetail
  useEffect(() => {
    if (rndsDetail?.notes) {
      setNotes(rndsDetail.notes);
    }
  }, [rndsDetail?.notes]);

  // URL page sync
  useEffect(() => {
    const pageParam = searchParams.get("page");
    if (pageParam) {
      setCurrentPage(Number(pageParam));
    }
  }, [searchParams]);

  // 수정 모달 열기
  const handleEditConsultation = (consultation: Consultation) => {
    setNewConsultation({
      date: consultation.date,
      content: consultation.content,
      start_date: consultation.start_date,
      end_date: consultation.end_date,
      participation: consultation.participation,
      user_id: consultation.user_id,
      total_cost: consultation.total_cost,
      gov_contribution: consultation.gov_contribution,
      pri_contribution: consultation.pri_contribution,
      org_id: consultation.org_id,
      rnd_id: consultation.rnd_id,
    });
    openEditModal(consultation);
  };

  // 추가 모달 열기
  const handleOpenAddModal = () => {
    setNewConsultation(getInitialConsultation(loginUser?.id || "", id as string));
    openAddModal();
  };

  // 모달 닫기
  const handleCloseModal = () => {
    closeConsultationModal();
    setNewConsultation(getInitialConsultation(loginUser?.id || "", id as string));
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/consultations/${id}?page=${page}`, { scroll: false });
  };

  return (
    <div className="text-sm text-[#37352F]">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4">
        <RnDInfoCard rndsDetail={rndsDetail} isLoading={rnDsDetailLoading} />
        <RnDNotesCard notes={rndsDetail?.notes || ""} isLoading={rnDsDetailLoading} />
      </div>

      <RnDActionBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={handleOpenAddModal}
        onEditNotesClick={() => setOpenNotesModal(true)}
      />

      <RnDConsultationModal
        mode={modalMode}
        isOpen={openConsultationModal}
        onClose={handleCloseModal}
        consultation={newConsultation}
        onConsultationChange={(data) => setNewConsultation((prev) => ({ ...prev, ...data }))}
        onSave={
          modalMode === "add"
            ? () => handleAddConsultation(newConsultation, handleCloseModal)
            : () => handleUpdateConsultation(selectedConsultation, newConsultation, handleCloseModal)
        }
        isSaving={saving}
        users={users}
        participationTypes={RND_PARTICIPATION_TYPES}
      />

      <RnDConsultationsTable
        consultations={consultations}
        users={users}
        loginUserId={loginUser?.id}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onEdit={handleEditConsultation}
        onDelete={openDeleteModalWithConsultation}
      />

      <RnDDeleteModal
        isOpen={openDeleteModal && !!consultationToDelete}
        onClose={closeDeleteModal}
        onConfirm={() => handleConfirmDelete(consultationToDelete, deleteReason, closeDeleteModal)}
        deleteReason={deleteReason}
        onReasonChange={setDeleteReason}
      />

      <RnDNotesModal
        isOpen={openNotesModal}
        onClose={() => setOpenNotesModal(false)}
        onSave={() => handleUpdateNotes(notes, () => setOpenNotesModal(false))}
        notes={notes}
        onNotesChange={setNotes}
      />

      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
