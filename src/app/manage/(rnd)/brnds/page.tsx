"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

import SnackbarComponent from "@/components/Snackbar";
import { useDebounce } from "@/hooks/useDebounce";
import { useLoginUser } from "@/context/login";
import { useAddbRnDs } from "@/hooks/manage/(rnds)/brnds/useAddbRnDs";
import { useUpdatebRnDs } from "@/hooks/manage/(rnds)/brnds/useUpdatebRnDs";
import { usebRnDsList } from "@/hooks/manage/(rnds)/brnds/usebRnDsList";
import { useOrgsList } from "@/hooks/manage/(rnds)/useOrgsList";

import {
  BrndsSearchFilter,
  BrndsTable,
  BrndsModal,
} from "@/components/manage/brnds";
import Pagination from "@/components/ui/Pagination";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

interface Brnds {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  gov_contribution: string;
  pri_contribution: string;
  total_cost: string;
  notes: string;
  support_org: string;
}

const initialBrnds: Brnds = {
  id: "",
  name: "",
  end_date: "",
  start_date: "",
  gov_contribution: "",
  pri_contribution: "",
  total_cost: "",
  notes: "",
  support_org: "",
};

export default function Page() {
  const user = useLoginUser();
  const router = useRouter();

  // 검색 및 페이징 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [brndsPerPage, setBrndsPerPage] = useState(10);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // 모달 상태
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentBrnds, setCurrentBrnds] = useState<Brnds>(initialBrnds);
  const [brndsToDelete, setBrndsToDelete] = useState<Brnds | null>(null);

  // 기타 상태
  const [saving, setSaving] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // SWR hooks
  const { brnds, isLoading, refreshRnds: refreshBrnds, total, isError } = usebRnDsList(
    currentPage,
    brndsPerPage,
    debouncedSearchTerm
  );
  const { orgs } = useOrgsList();
  const { addbRnds } = useAddbRnDs();
  const { updatebRnds } = useUpdatebRnDs();

  // 페이징 정보 업데이트
  useEffect(() => {
    if (!isLoading && !isError && brnds) {
      setTotalPages(Math.ceil(total / brndsPerPage));
    }
  }, [brnds, total, isLoading, isError, brndsPerPage]);

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
    setCurrentBrnds(initialBrnds);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const openEditModal = (brnd: Brnds) => {
    setCurrentBrnds({ ...brnd });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentBrnds(initialBrnds);
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (
      !currentBrnds.name ||
      !currentBrnds.end_date ||
      !currentBrnds.gov_contribution ||
      !currentBrnds.start_date ||
      !currentBrnds.total_cost
    ) {
      setSnackbarMessage("필수 입력값을 모두 채워주세요.");
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...currentBrnds,
        total_cost: removeComma(currentBrnds.total_cost),
        gov_contribution: removeComma(currentBrnds.gov_contribution),
      };

      if (modalMode === "add") {
        await addbRnds(dataToSave);
        setSnackbarMessage("비R&D 사업 추가 완료");
      } else {
        await updatebRnds(dataToSave);
        setSnackbarMessage("비R&D 사업 수정 완료");
      }
      await refreshBrnds();
      closeModal();
    } catch (error) {
      console.error(`Error ${modalMode === "add" ? "adding" : "updating"} brnds:`, error);
      setSnackbarMessage(`비R&D 사업 ${modalMode === "add" ? "추가" : "수정"} 실패`);
    } finally {
      setSaving(false);
    }
  };

  // 삭제 핸들러
  const handleDelete = (brnd: Brnds) => {
    setBrndsToDelete(brnd);
    setDeleteReason("");
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteReason || !brndsToDelete) return;

    try {
      const { error } = await supabase.from("deletion_requests").insert([
        {
          type: "bRnDs",
          related_id: brndsToDelete.id,
          status: "pending",
          request_date: new Date(),
          user_id: user?.id || "",
          delete_reason: deleteReason,
          content: { companies: `비R&D삭제 : ${brndsToDelete.name}` },
        },
      ]);

      if (error) throw error;

      setSnackbarMessage("삭제 요청 완료");
      setIsDeleteModalOpen(false);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error deleting brnds:", error);
      setSnackbarMessage("삭제 요청 실패");
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setBrndsToDelete(null);
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <BrndsSearchFilter
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
          <label className="mr-2 text-sm text-slate-500">표시 개수:</label>
          <select
            value={brndsPerPage}
            onChange={(e) => {
              setBrndsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-slate-300 p-2 rounded-md text-sm"
          >
            <option value="10">10개</option>
            <option value="20">20개</option>
            <option value="30">30개</option>
            <option value="50">50개</option>
          </select>
        </div>
      </div>

      <BrndsTable
        brnds={brnds || []}
        onRowClick={(id) => router.push(`/manage/brnds/${id}`)}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <BrndsModal
        mode={modalMode}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        isSaving={saving}
        brndsData={currentBrnds}
        onBrndsDataChange={(data) => setCurrentBrnds({ ...currentBrnds, ...data })}
        orgs={orgs || []}
        formatNumber={formatNumber}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen && !!brndsToDelete}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        itemName={brndsToDelete?.name}
        itemType="비R&D"
        requireReason
        reason={deleteReason}
        onReasonChange={setDeleteReason}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      </motion.div>

      <SnackbarComponent
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </div>
  );
}
