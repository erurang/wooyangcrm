"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLoginUser } from "@/context/login";
import SnackbarComponent from "@/components/Snackbar";

import { useDebounce } from "@/hooks/useDebounce";
import { useContactsList } from "@/hooks/manage/contacts/useContactsList";
import { useAddContacts } from "@/hooks/manage/customers/useAddContacts";
import { useUpdateContacts } from "@/hooks/manage/customers/useUpdateContacts";
import { useCompanySearch } from "@/hooks/manage/contacts/useCompanySearch";

import {
  ContactsSearchFilters,
  ContactsTable,
  ContactsPagination,
  ContactModal,
  ContactDeleteModal,
} from "@/components/manage/contacts/list";

interface Contact {
  id: string;
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
  company_id: string;
  companies: {
    name: string;
  };
  note: string;
}

const getInitialContactData = () => ({
  contactName: "",
  department: "",
  level: "",
  email: "",
  mobile: "",
  notes: "",
  companyName: "",
});

export default function ContactsPage() {
  const user = useLoginUser();

  // Search filters
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [contactsPerPage, setContactsPerPage] = useState(10);

  // Modal states
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Data states
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [contactData, setContactData] = useState(getInitialContactData());

  // Debounced search values
  const debouncedContactName = useDebounce(contactName, 300);
  const debouncedEmail = useDebounce(email, 300);
  const debouncedCompanyName = useDebounce(companyName, 300);
  const debouncedMobile = useDebounce(mobile, 300);

  // SWR hooks
  const { companies } = useCompanySearch(contactData.companyName);
  const { contacts, total, refreshContacts, isLoading: isContactsLoading } = useContactsList(
    currentPage,
    contactsPerPage,
    debouncedContactName,
    debouncedEmail,
    debouncedMobile,
    debouncedCompanyName,
    "false"
  );
  const { addContacts } = useAddContacts();
  const { updateContacts } = useUpdateContacts();

  const totalPages = Math.ceil(total / contactsPerPage);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setOpenDeleteModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const resetModalFields = () => {
    setContactData(getInitialContactData());
    setSelectedContact(null);
  };

  const resetFilters = () => {
    setCompanyName("");
    setContactName("");
    setEmail("");
    setMobile("");
    setCurrentPage(1);
  };

  const handleOpenAddModal = () => {
    resetModalFields();
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setContactData({
      contactName: contact.contact_name,
      department: contact.department,
      level: contact.level,
      email: contact.email,
      mobile: contact.mobile,
      notes: contact.note,
      companyName: contact.companies?.name || "",
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetModalFields();
  };

  const handleAddContact = async () => {
    if (!contactData.companyName.trim()) {
      setSnackbarMessage("거래처명을 입력해주세요.");
      return;
    }

    const matchedCompany = companies.find(
      (c: any) => c.name === contactData.companyName
    );
    if (!matchedCompany) {
      setSnackbarMessage("존재하지 않는 거래처명입니다.");
      return;
    }

    if (!contactData.contactName.trim()) {
      setSnackbarMessage("담당자 이름을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      await addContacts(
        [
          {
            contact_name: contactData.contactName,
            email: contactData.email,
            mobile: contactData.mobile,
            level: contactData.level,
            department: contactData.department,
            note: contactData.notes,
          },
        ],
        matchedCompany.id
      );

      setSnackbarMessage("담당자가 추가되었습니다");
      setIsModalOpen(false);
      resetModalFields();
      await refreshContacts();
    } catch (error) {
      console.error("Error adding contact:", error);
      setSnackbarMessage("담당자 추가 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateContact = async () => {
    if (!selectedContact) return;

    setSaving(true);
    try {
      await updateContacts(
        [
          {
            id: selectedContact.id,
            contact_name: contactData.contactName,
            email: contactData.email,
            mobile: contactData.mobile,
            level: contactData.level,
            department: contactData.department,
            note: contactData.notes,
          },
        ],
        selectedContact.company_id
      );
      await refreshContacts();

      setSnackbarMessage("담당자 정보가 수정되었습니다.");
      setIsModalOpen(false);
      resetModalFields();
    } catch (error) {
      console.error("Error updating contact:", error);
      setSnackbarMessage("담당자 정보 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = (contact: Contact) => {
    setContactToDelete(contact);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete || deleteReason.length === 0) return;

    try {
      const { error } = await supabase.from("deletion_requests").insert([
        {
          related_id: contactToDelete.id,
          status: "pending",
          type: "contacts",
          request_date: new Date(),
          user_id: user?.id || "",
          delete_reason: deleteReason,
          content: {
            contacts: `담당자삭제 : ${contactToDelete?.contact_name} ${contactToDelete?.level} `,
          },
        },
      ]);

      if (error) {
        setSnackbarMessage("삭제 요청을 생성하는 데 실패했습니다.");
      } else {
        setSnackbarMessage("삭제 요청이 생성되었습니다.");
        setOpenDeleteModal(false);
        setDeleteReason("");
        setContactToDelete(null);
      }
    } catch {
      setSnackbarMessage("삭제 요청 생성 중 오류가 발생했습니다.");
    }
  };

  const handleSearchFilterChange = (field: string) => (value: string) => {
    setCurrentPage(1);
    switch (field) {
      case "companyName":
        setCompanyName(value);
        break;
      case "contactName":
        setContactName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "mobile":
        setMobile(value);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-sm text-gray-800">
      {/* Search Filters */}
      <ContactsSearchFilters
        companyName={companyName}
        contactName={contactName}
        email={email}
        mobile={mobile}
        onCompanyNameChange={handleSearchFilterChange("companyName")}
        onContactNameChange={handleSearchFilterChange("contactName")}
        onEmailChange={handleSearchFilterChange("email")}
        onMobileChange={handleSearchFilterChange("mobile")}
        onReset={resetFilters}
        onAddClick={handleOpenAddModal}
      />

      {/* Table Control */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          총 <span className="font-semibold text-blue-600">{total}</span>명의 담당자
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">표시 개수:</label>
          <select
            value={contactsPerPage}
            onChange={(e) => {
              setContactsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="10">10개</option>
            <option value="20">20개</option>
            <option value="30">30개</option>
            <option value="50">50개</option>
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      <ContactsTable
        contacts={contacts}
        isLoading={isContactsLoading}
        onEdit={handleEditContact}
        onDelete={handleDeleteContact}
        onAdd={handleOpenAddModal}
        hasSearchQuery={!!(companyName || contactName || email || mobile)}
      />

      {/* Pagination */}
      <ContactsPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Contact Modal (Add/Edit) */}
      <ContactModal
        mode={modalMode}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={modalMode === "add" ? handleAddContact : handleUpdateContact}
        isSaving={saving}
        contactData={contactData}
        onContactDataChange={(data) =>
          setContactData((prev) => ({ ...prev, ...data }))
        }
      />

      {/* Delete Modal */}
      <ContactDeleteModal
        isOpen={openDeleteModal}
        contact={contactToDelete}
        deleteReason={deleteReason}
        onReasonChange={setDeleteReason}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setOpenDeleteModal(false);
          setContactToDelete(null);
          setDeleteReason("");
        }}
      />

      {/* Snackbar */}
      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
