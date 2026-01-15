"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLoginUser } from "@/context/login";
import SnackbarComponent from "@/components/Snackbar";

import { useDebounce } from "@/hooks/useDebounce";
import { useOrgsList } from "@/hooks/manage/(rnds)/orgs/useOrgsList";
import { useAddOrgs } from "@/hooks/manage/(rnds)/orgs/useAddOrgs";
import { useUpdateOrgs } from "@/hooks/manage/(rnds)/orgs/useUpdateOrgs";
import { useAddOrgsContacts } from "@/hooks/manage/(rnds)/orgs/useAddOrgsContacts";

import {
  OrgsSearchFilter,
  OrgsTable,
  OrgsModal,
  OrgsDeleteModal,
  OrgsPagination,
} from "@/components/manage/orgs";

interface Contact {
  id?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  level: string;
}

interface RnDsOrgs {
  id: string;
  name: string;
  address: string;
  notes: string;
  phone: string;
  fax: string;
  email: string;
  rnds_contacts: Contact[];
}

const INITIAL_ORG_STATE: RnDsOrgs = {
  id: "",
  name: "",
  address: "",
  email: "",
  fax: "",
  notes: "",
  phone: "",
  rnds_contacts: [],
};

export default function Page() {
  const user = useLoginUser();
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
  const [currentRndsOrgs, setCurrentRndsOrgs] =
    useState<RnDsOrgs>(INITIAL_ORG_STATE);
  const [rndsToDelete, setRndsToDelete] = useState<RnDsOrgs | null>(null);

  // Debounce
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // SWR hooks
  const { orgs, isLoading, refreshOrgs, total, isError } = useOrgsList(
    currentPage,
    rndsPerPage,
    debouncedSearchTerm
  );

  const { addOrgs } = useAddOrgs();
  const { addContacts } = useAddOrgsContacts();
  const { updateOrgs } = useUpdateOrgs();

  // Update pagination
  useEffect(() => {
    if (!isLoading && !isError && orgs) {
      setTotalPages(Math.ceil(total / rndsPerPage));
    }
  }, [orgs, total, isLoading, isError, rndsPerPage]);

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

  // Search filter handlers
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
    setCurrentRndsOrgs(INITIAL_ORG_STATE);
  };

  const handleAdd = () => {
    setCurrentRndsOrgs(INITIAL_ORG_STATE);
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleEdit = (org: RnDsOrgs) => {
    setCurrentRndsOrgs({
      id: org.id,
      name: org.name || "",
      address: org.address || "",
      email: org.email || "",
      fax: org.fax || "",
      notes: org.notes || "",
      phone: org.phone || "",
      rnds_contacts:
        org.rnds_contacts?.map((contact: any) => ({
          id: contact.id || "",
          name: contact.name || "",
          phone: contact.phone || "",
          email: contact.email || "",
          department: contact.department || "",
          level: contact.level || "",
        })) || [],
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  // Save handlers
  const handleSave = async () => {
    if (!currentRndsOrgs.name) {
      setSnackbarMessage("기관명을 입력해주세요.");
      return;
    }

    if (currentRndsOrgs.rnds_contacts.length === 0) {
      setSnackbarMessage("담당자를 최소 1명 입력해주세요.");
      return;
    }

    setSaving(true);

    try {
      if (modalMode === "add") {
        const orgData = await addOrgs(currentRndsOrgs);
        await addContacts(currentRndsOrgs.rnds_contacts, orgData.id);
        setSnackbarMessage("지원기관 추가 완료");
      } else {
        await updateOrgs({
          ...currentRndsOrgs,
          rnds_contacts: currentRndsOrgs.rnds_contacts,
        });
        setSnackbarMessage("지원기관 수정 완료");
      }
      await refreshOrgs();
      closeModal();
    } catch (error) {
      console.error("Error saving orgs:", error);
      setSnackbarMessage(
        modalMode === "add" ? "지원기관 추가 실패" : "지원기관 수정 실패"
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const handleDelete = (org: RnDsOrgs) => {
    setRndsToDelete(org);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteReason.length === 0 || !rndsToDelete) return;

    try {
      const { error } = await supabase.from("deletion_requests").insert([
        {
          type: "rnd_orgs",
          related_id: rndsToDelete.id,
          status: "pending",
          request_date: new Date(),
          user_id: user?.id || "",
          delete_reason: deleteReason,
          content: {
            companies: `지원기관삭제 : ${rndsToDelete.name}`,
          },
        },
      ]);

      if (error) throw error;

      setSnackbarMessage("삭제 요청 완료");
      setIsDeleteModalOpen(false);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error deleting company:", error);
      setSnackbarMessage("삭제 요청 실패");
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setRndsToDelete(null);
    setDeleteReason("");
  };

  // Org data change handler
  const handleOrgDataChange = (data: Partial<RnDsOrgs>) => {
    setCurrentRndsOrgs((prev) => ({ ...prev, ...data }));
  };

  // Contact handlers
  const addContact = () => {
    setCurrentRndsOrgs((prev) => ({
      ...prev,
      rnds_contacts: [
        { name: "", phone: "", department: "", level: "", email: "" },
        ...prev.rnds_contacts,
      ],
    }));
  };

  const handleContactChange = (
    index: number,
    field: keyof Contact,
    value: string
  ) => {
    setCurrentRndsOrgs((prev) => {
      const updatedContacts = [...prev.rnds_contacts];
      updatedContacts[index] = { ...updatedContacts[index], [field]: value };
      return { ...prev, rnds_contacts: updatedContacts };
    });
  };

  const removeContact = (index: number) => {
    setCurrentRndsOrgs((prev) => {
      const updatedContacts = [...prev.rnds_contacts];
      updatedContacts.splice(index, 1);
      return { ...prev, rnds_contacts: updatedContacts };
    });
  };

  return (
    <div className="text-sm text-[#37352F]">
      {/* Search Filter */}
      <OrgsSearchFilter
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
      <OrgsTable orgs={orgs || []} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Modal */}
      <OrgsModal
        mode={modalMode}
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        isSaving={saving}
        orgData={currentRndsOrgs}
        onOrgDataChange={handleOrgDataChange}
        onAddContact={addContact}
        onContactChange={handleContactChange}
        onRemoveContact={removeContact}
      />

      {/* Delete Modal */}
      <OrgsDeleteModal
        isOpen={isDeleteModalOpen}
        org={rndsToDelete}
        deleteReason={deleteReason}
        onReasonChange={setDeleteReason}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Pagination */}
      <OrgsPagination
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
