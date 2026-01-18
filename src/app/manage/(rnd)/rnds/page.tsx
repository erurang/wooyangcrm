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
  RnDsSearchFilter,
  RnDsTable,
  RnDsModal,
  RnDsDeleteModal,
  RnDsPagination,
} from "@/components/manage/rnds/list";
import { formatNumber, parseFormattedNumber } from "@/lib/formatNumber";

interface RnDs {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  gov_contribution: string;
  pri_contribution: string;
  total_cost: string;
  notes: string;
  support_org: string;
  rnd_orgs: {
    name: string;
  };
}

const INITIAL_RND_STATE: RnDs = {
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

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rndsPerPage, setRndsPerPage] = useState(10);
  const [deleteReason, setDeleteReason] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");

  // Modal states
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRnds, setCurrentRnds] = useState<RnDs>(INITIAL_RND_STATE);
  const [rndsToDelete, setRndsToDelete] = useState<RnDs | null>(null);

  // Debounce
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // SWR hooks
  const { rnds, isLoading, refreshRnds, total, isError } = useRnDsList(
    currentPage,
    rndsPerPage,
    debouncedSearchTerm
  );
  const { orgs } = useOrgsList();
  const { addRnds } = useAddRnDs();
  const { updateRnds } = useUpdateRnDs();

  // Update pagination
  useEffect(() => {
    if (!isLoading && !isError && rnds) {
      setTotalPages(Math.ceil(total / rndsPerPage));
    }
  }, [rnds, total, isLoading, isError, rndsPerPage]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isModalOpen) {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  // Utility function for removing commas (parseFormattedNumber is used from lib)
  const removeComma = (value: string) => parseFormattedNumber(value);

  // Search handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Modal handlers
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRnds(INITIAL_RND_STATE);
  };

  const handleAdd = () => {
    setCurrentRnds(INITIAL_RND_STATE);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleEdit = (rnd: RnDs) => {
    setCurrentRnds({ ...rnd });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  // Save handlers
  const handleSave = async () => {
    if (
      !currentRnds.name ||
      !currentRnds.end_date ||
      !currentRnds.gov_contribution ||
      !currentRnds.start_date ||
      !currentRnds.total_cost
    ) {
      setSnackbarMessage("필수 입력값을 모두 채워주세요.");
      return;
    }

    setSaving(true);

    try {
      const dataToSave = {
        ...currentRnds,
        total_cost: removeComma(currentRnds.total_cost),
        gov_contribution: removeComma(currentRnds.gov_contribution),
      };

      if (modalMode === "add") {
        await addRnds(dataToSave);
        setSnackbarMessage("R&D 사업 추가 완료");
      } else {
        await updateRnds(dataToSave);
        setSnackbarMessage("R&D 사업 수정 완료");
      }

      await refreshRnds();
      closeModal();
    } catch (error) {
      console.error("Error saving rnds:", error);
      setSnackbarMessage(
        modalMode === "add" ? "R&D 사업 추가 실패" : "R&D 사업 수정 실패"
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const handleDelete = (rnd: RnDs) => {
    setRndsToDelete(rnd);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteReason.length === 0 || !rndsToDelete) return;

    try {
      const { error } = await supabase.from("deletion_requests").insert([
        {
          type: "RnDs",
          related_id: rndsToDelete.id,
          status: "pending",
          request_date: new Date(),
          user_id: user?.id || "",
          delete_reason: deleteReason,
          content: {
            companies: `R&D삭제 : ${rndsToDelete.name}`,
          },
        },
      ]);

      if (error) throw error;

      setSnackbarMessage("삭제 요청 완료");
      setIsDeleteModalOpen(false);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error deleting rnds:", error);
      setSnackbarMessage("삭제 요청 실패");
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setRndsToDelete(null);
    setDeleteReason("");
  };

  // Rnd data change handler
  const handleRndDataChange = (data: Partial<RnDs>) => {
    setCurrentRnds((prev) => ({ ...prev, ...data }));
  };

  return (
    <div className="text-sm text-[#37352F]">
      {/* Search Filter */}
      <RnDsSearchFilter
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onReset={handleResetFilter}
      />

      {/* Action Bar */}
      <div className="flex justify-between items-center my-4">
        <div className="flex">
          <div
            className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
            onClick={handleAdd}
          >
            <span className="mr-2">+</span>
            <span>추가</span>
          </div>
        </div>

        <div className="flex items-center">
          <label className="mr-2 text-sm text-gray-600">표시 개수:</label>
          <select
            value={rndsPerPage}
            onChange={(e) => {
              setRndsPerPage(Number(e.target.value));
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

      {/* Table */}
      <RnDsTable
        rnds={rnds || []}
        onRowClick={(id) => router.push(`/manage/rnds/${id}`)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        formatNumber={formatNumber}
      />

      {/* Modal */}
      <RnDsModal
        mode={modalMode}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        isSaving={saving}
        rndData={currentRnds}
        onRndDataChange={handleRndDataChange}
        orgs={orgs || []}
        formatNumber={formatNumber}
      />

      {/* Delete Modal */}
      <RnDsDeleteModal
        isOpen={isDeleteModalOpen}
        rnd={rndsToDelete}
        deleteReason={deleteReason}
        onReasonChange={setDeleteReason}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Pagination */}
      <RnDsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Snackbar */}
      <SnackbarComponent
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </div>
  );
}
