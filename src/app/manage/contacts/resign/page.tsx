"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

import SnackbarComponent from "@/components/Snackbar";
import { useDebounce } from "@/hooks/useDebounce";
import { useContactsList } from "@/hooks/manage/contacts/useContactsList";
import { useUpdateContacts } from "@/hooks/manage/customers/useUpdateContacts";
import { useLoginUser } from "@/context/login";

import {
  ResignSearchFilter,
  ResignTable,
  ResignStatusModal,
  ResignDeleteModal,
  ResignPagination,
} from "@/components/manage/contacts/resign";

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

export default function ContactsResignPage() {
  const user = useLoginUser();

  // 검색 필터 상태
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [contactsPerPage, setContactsPerPage] = useState(10);

  // 모달 상태
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  // 기타 상태
  const [saving, setSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // 디바운스
  const debouncedContactNameTerm = useDebounce(contactName, 300);
  const debouncedEmailTerm = useDebounce(email, 300);
  const debouncedCompanyNameTerm = useDebounce(companyName, 300);
  const debouncedMobileTerm = useDebounce(mobile, 300);

  // SWR hooks
  const { contacts, total, refreshContacts, isLoading: isContactsLoading } = useContactsList(
    currentPage,
    contactsPerPage,
    debouncedContactNameTerm,
    debouncedEmailTerm,
    debouncedMobileTerm,
    debouncedCompanyNameTerm,
    "true"
  );
  const { updateContacts } = useUpdateContacts();

  const totalPages = Math.ceil(total / contactsPerPage);

  // ESC 키 핸들러
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsStatusModalOpen(false);
        setIsDeleteModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 필터 초기화
  const resetFilters = () => {
    setCompanyName("");
    setContactName("");
    setEmail("");
    setMobile("");
    setCurrentPage(1);
  };

  // 검색 핸들러
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setCurrentPage(1);
    }
  };

  // 재직 상태 변경 핸들러
  const handleChangeResignStatus = (contact: Contact) => {
    setSelectedContact(contact);
    setIsStatusModalOpen(true);
  };

  const handleUpdateContact = async () => {
    if (!selectedContact) return;

    setSaving(true);
    try {
      await updateContacts(
        [
          {
            id: selectedContact.id,
            contact_name: selectedContact.contact_name,
            email: selectedContact.email,
            mobile: selectedContact.mobile,
            level: selectedContact.level,
            department: selectedContact.department,
            note: selectedContact.note,
            resign: false,
          },
        ],
        selectedContact.company_id
      );
      await refreshContacts();

      setSnackbarMessage("담당자가 재직 상태로 변경되었습니다.");
      setIsStatusModalOpen(false);
      setSelectedContact(null);
    } catch (error) {
      console.error("Error updating contact:", error);
      setSnackbarMessage("담당자 상태 변경 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 삭제 핸들러
  const handleDeleteContact = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteReason("");
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete || !deleteReason) return;

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
            contacts: `담당자삭제 : ${contactToDelete.contact_name} ${contactToDelete.level}`,
          },
        },
      ]);

      if (error) {
        setSnackbarMessage("삭제 요청을 생성하는 데 실패했습니다.");
      } else {
        setSnackbarMessage("삭제 요청이 생성되었습니다.");
        setIsDeleteModalOpen(false);
        setDeleteReason("");
        setContactToDelete(null);
      }
    } catch (error) {
      setSnackbarMessage("삭제 요청 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="text-sm text-gray-800">
      <ResignSearchFilter
        companyName={companyName}
        contactName={contactName}
        email={email}
        mobile={mobile}
        onCompanyNameChange={(value) => {
          setCompanyName(value);
          setCurrentPage(1);
        }}
        onContactNameChange={(value) => {
          setContactName(value);
          setCurrentPage(1);
        }}
        onEmailChange={(value) => {
          setEmail(value);
          setCurrentPage(1);
        }}
        onMobileChange={(value) => {
          setMobile(value);
          setCurrentPage(1);
        }}
        onKeyPress={handleKeyPress}
        onReset={resetFilters}
      />

      {/* 테이블 컨트롤 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          총 <span className="font-semibold text-blue-600">{total}</span>명의
          퇴사자
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

      <ResignTable
        contacts={contacts || []}
        isLoading={isContactsLoading}
        onChangeStatus={handleChangeResignStatus}
        onDelete={handleDeleteContact}
        hasSearchQuery={!!(companyName || contactName || email || mobile)}
      />

      <ResignPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <ResignStatusModal
        isOpen={isStatusModalOpen}
        contact={selectedContact}
        saving={saving}
        onConfirm={handleUpdateContact}
        onCancel={() => {
          setIsStatusModalOpen(false);
          setSelectedContact(null);
        }}
      />

      <ResignDeleteModal
        isOpen={isDeleteModalOpen}
        contact={contactToDelete}
        deleteReason={deleteReason}
        onReasonChange={setDeleteReason}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setContactToDelete(null);
          setDeleteReason("");
        }}
      />

      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
