"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

import SnackbarComponent from "@/components/Snackbar";
import { useDebounce } from "@/hooks/useDebounce";
import { useLoginUser } from "@/context/login";
import { useRnDsList } from "@/hooks/manage/(rnds)/rnds/useRnDsList";
import { useAddRnDs } from "@/hooks/manage/(rnds)/rnds/useAddRnDs";
import { useUpdateRnDs } from "@/hooks/manage/(rnds)/rnds/useUpdateRnDs";
import { useOrgsList } from "@/hooks/manage/(rnds)/useOrgsList";

import {
  DevelopSearchFilter,
  DevelopTable,
  DevelopModal,
} from "@/components/manage/develop";
import Pagination from "@/components/ui/Pagination";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

interface Develop {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  gov_contribution: string;
  pri_contribution: string;
  total_cost: string;
  notes: string;
  support_org: string;
  rnd_orgs?: {
    name: string;
  };
}

const initialDevelop: Develop = {
  id: "",
  name: "",
  end_date: "",
  start_date: "",
  gov_contribution: "",
  pri_contribution: "",
  total_cost: "",
  notes: "",
  support_org: "",
  rnd_orgs: { name: "" },
};

export default function Page() {
  const user = useLoginUser();
  const router = useRouter();

  // 검색 및 페이징 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [developsPerPage, setDevelopsPerPage] = useState(10);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // 모달 상태
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentDevelop, setCurrentDevelop] = useState<Develop>(initialDevelop);
  const [developToDelete, setDevelopToDelete] = useState<Develop | null>(null);

  // 기타 상태
  const [saving, setSaving] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // SWR hooks
  const { rnds: develops, isLoading, refreshRnds: refreshDevelops, total, isError } = useRnDsList(
    currentPage,
    developsPerPage,
    debouncedSearchTerm
  );
  const { orgs } = useOrgsList();
  const { addRnds: addDevelop } = useAddRnDs();
  const { updateRnds: updateDevelop } = useUpdateRnDs();

  // 페이징 정보 업데이트
  useEffect(() => {
    if (!isLoading && !isError && develops) {
      setTotalPages(Math.ceil(total / developsPerPage));
    }
  }, [develops, total, isLoading, isError, developsPerPage]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // 유틸리티 함수
  const formatNumber = (value: string) => {
    const cleanedValue = value.replace(/[^0-9]/g, "");
    return cleanedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const removeComma = (value: string) => value.replace(/,/g, "");

  // 모달 핸들러
  const openAddModal = () => {
    setCurrentDevelop(initialDevelop);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const openEditModal = (develop: Develop) => {
    setCurrentDevelop({ ...develop });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentDevelop(initialDevelop);
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (
      !currentDevelop.name ||
      !currentDevelop.end_date ||
      !currentDevelop.gov_contribution ||
      !currentDevelop.start_date ||
      !currentDevelop.total_cost
    ) {
      setSnackbarMessage("필수 입력값을 모두 채워주세요.");
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...currentDevelop,
        total_cost: removeComma(currentDevelop.total_cost),
        gov_contribution: removeComma(currentDevelop.gov_contribution),
      };

      if (modalMode === "add") {
        await addDevelop(dataToSave);
        setSnackbarMessage("R&D 사업 추가 완료");
      } else {
        await updateDevelop(dataToSave);
        setSnackbarMessage("R&D 사업 수정 완료");
      }
      await refreshDevelops();
      closeModal();
    } catch (error) {
      console.error(`Error ${modalMode === "add" ? "adding" : "updating"} develop:`, error);
      setSnackbarMessage(`R&D 사업 ${modalMode === "add" ? "추가" : "수정"} 실패`);
    } finally {
      setSaving(false);
    }
  };

  // 삭제 핸들러
  const handleDelete = (develop: Develop) => {
    setDevelopToDelete(develop);
    setDeleteReason("");
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteReason || !developToDelete) return;

    try {
      const { error } = await supabase.from("deletion_requests").insert([
        {
          type: "RnDs",
          related_id: developToDelete.id,
          status: "pending",
          request_date: new Date(),
          user_id: user?.id || "",
          delete_reason: deleteReason,
          content: { companies: `R&D삭제 : ${developToDelete.name}` },
        },
      ]);

      if (error) throw error;

      setSnackbarMessage("삭제 요청 완료");
      setIsDeleteModalOpen(false);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error deleting develop:", error);
      setSnackbarMessage("삭제 요청 실패");
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDevelopToDelete(null);
  };

  // 검색 핸들러
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterReset = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  return (
    <div className="text-sm text-[#37352F]">
      <DevelopSearchFilter
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onReset={handleFilterReset}
      />

      <div className="flex justify-between items-center my-4">
        <div
          className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
          onClick={openAddModal}
        >
          <span className="mr-2">+</span>
          <span>추가</span>
        </div>

        <div className="flex items-center">
          <label className="mr-2 text-sm text-gray-600">표시 개수:</label>
          <select
            value={developsPerPage}
            onChange={(e) => {
              setDevelopsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 p-2 rounded-md text-sm"
          >
            <option value="10">10개</option>
            <option value="20">20개</option>
            <option value="30">30개</option>
            <option value="50">50개</option>
          </select>
        </div>
      </div>

      <DevelopTable
        develops={(develops as unknown as Develop[]) || []}
        onRowClick={(id) => router.push(`/manage/rnds/${id}`)}
        onEdit={openEditModal}
        onDelete={handleDelete}
        formatNumber={formatNumber}
      />

      <DevelopModal
        mode={modalMode}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        isSaving={saving}
        developData={currentDevelop as unknown as Develop}
        onDevelopDataChange={(data) => setCurrentDevelop({ ...currentDevelop, ...data })}
        orgs={orgs || []}
        formatNumber={formatNumber}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen && !!developToDelete}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        itemName={developToDelete?.name}
        itemType="R&D"
        requireReason
        reason={deleteReason}
        onReasonChange={setDeleteReason}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <SnackbarComponent
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </div>
  );
}
