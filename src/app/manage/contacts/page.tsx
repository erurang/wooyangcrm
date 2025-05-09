"use client";

import type React from "react";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useRef, useMemo } from "react";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  X,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  User,
  Building,
  Mail,
  Phone,
  AlertCircle,
  Briefcase,
} from "lucide-react";

import SnackbarComponent from "@/components/Snackbar";

import { useDebounce } from "@/hooks/useDebounce";
import { useContactsList } from "@/hooks/manage/contacts/useContactsList";
import { useAddContacts } from "@/hooks/manage/customers/useAddContacts";
import { useUpdateContacts } from "@/hooks/manage/customers/useUpdateContacts";
import { useCompanySearch } from "@/hooks/manage/contacts/useCompanySearch";
import { useDeleteContact } from "@/hooks/manage/contacts/useDeleteContact";
import { supabase } from "@/lib/supabaseClient";
import { useLoginUser } from "@/context/login";

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

export default function ContactsPage() {
  const user = useLoginUser();
  const [companyName, setCompanyName] = useState<string>("");
  const [deleteReason, setDeleteReason] = useState("");
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const [contactName, setContactName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [contactsPerPage, setContactsPerPage] = useState(10);
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLUListElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 모달에서 입력할 상태
  const [modalContactName, setModalContactName] = useState("");
  const [modalDepartment, setModalDepartment] = useState("");
  const [modalLevel, setModalLevel] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalMobile, setModalMobile] = useState("");
  const [modalNotes, setModalNotes] = useState("");

  const [inputCompanyName, setInputCompanyName] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // debounce
  const debouncedContactNameTerm = useDebounce(contactName, 300);
  const debouncedEmailTerm = useDebounce(email, 300);
  const debouncedCompanyNameTerm = useDebounce(companyName, 300);
  const debouncedMobileTerm = useDebounce(mobile, 300);
  const debouncedInputCompanyNameTerm = useDebounce(inputCompanyName, 300);

  // SWR hooks
  const { companies } = useCompanySearch(inputCompanyName);
  const { contacts, total, refreshContacts } = useContactsList(
    currentPage,
    contactsPerPage,
    debouncedContactNameTerm,
    debouncedEmailTerm,
    debouncedMobileTerm,
    debouncedCompanyNameTerm,
    "false"
  );

  const { addContacts } = useAddContacts();
  const { updateContacts } = useUpdateContacts();
  const { deleteContact } = useDeleteContact();

  const filteredCompanies = useMemo(() => {
    if (!debouncedInputCompanyNameTerm) return [];
    return companies.filter((c: any) =>
      c.name.includes(debouncedInputCompanyNameTerm)
    );
  }, [debouncedInputCompanyNameTerm, companies]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setIsAddModalOpen(false);
        setIsModalOpen(false);
        setOpenDeleteModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 거래처명 입력 시 드롭다운 열기
  useEffect(() => {
    setIsDropdownOpen(filteredCompanies.length > 0);
  }, [filteredCompanies]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setCurrentPage(1);
    }
  };

  async function handleAddContact() {
    if (!inputCompanyName.trim()) {
      setSnackbarMessage("거래처명을 입력해주세요.");
      return;
    }

    const matchedCompany = companies.find(
      (c: any) => c.name === inputCompanyName
    );
    if (!matchedCompany) {
      setSnackbarMessage("존재하지 않는 거래처명입니다.");
      return;
    }

    if (!modalContactName.trim()) {
      setSnackbarMessage("담당자 이름을 입력해주세요.");
      return;
    }

    setSaving(true);

    try {
      await addContacts(
        [
          {
            contact_name: modalContactName,
            email: modalEmail,
            mobile: modalMobile,
            level: modalLevel,
            department: modalDepartment,
            note: modalNotes,
          },
        ],
        matchedCompany.id
      );

      setSnackbarMessage("담당자가 추가되었습니다");
      setIsAddModalOpen(false);
      resetModalFields();
      await refreshContacts();
    } catch (error) {
      console.error("Error adding contact:", error);
      setSnackbarMessage("담당자 추가 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  const resetModalFields = () => {
    setModalContactName("");
    setModalEmail("");
    setModalMobile("");
    setModalLevel("");
    setModalDepartment("");
    setModalNotes("");
    setInputCompanyName("");
  };

  const resetFilters = () => {
    setCompanyName("");
    setContactName("");
    setEmail("");
    setMobile("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / contactsPerPage);

  const paginationNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pageNumbers.push(i);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        pageNumbers.push("...");
      }
    }
    return pageNumbers;
  };

  // 수정 버튼 클릭 시 기존 데이터 불러오기
  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setModalContactName(contact.contact_name);
    setModalDepartment(contact.department);
    setModalLevel(contact.level);
    setModalEmail(contact.email);
    setModalMobile(contact.mobile);
    setModalNotes(contact.note);
    setInputCompanyName(contact.companies?.name || "");
    setIsModalOpen(true);
  };

  const handleUpdateContact = async () => {
    if (!selectedContact) return;

    setSaving(true);
    try {
      await updateContacts(
        [
          {
            id: selectedContact.id,
            contact_name: modalContactName,
            email: modalEmail,
            mobile: modalMobile,
            level: modalLevel,
            department: modalDepartment,
            note: modalNotes,
          },
        ],
        selectedContact.company_id
      );
      await refreshContacts();

      setSnackbarMessage("담당자 정보가 수정되었습니다.");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating contact:", error);
      setSnackbarMessage("담당자 정보 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    setContactToDelete(contact);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!contactToDelete) return;
    if (deleteReason.length === 0) return;

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
    } catch (error) {
      setSnackbarMessage("삭제 요청 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="text-sm text-gray-800">
      {/* 페이지 헤더 */}

      {/* 검색 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 거래처명 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              거래처명
            </label>
            <div className="relative">
              <input
                type="text"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={handleKeyPress}
                placeholder="거래처명 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Building
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {/* 담당자명 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              담당자명
            </label>
            <div className="relative">
              <input
                type="text"
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={handleKeyPress}
                placeholder="담당자명 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {/* 이메일 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <div className="relative">
              <input
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={handleKeyPress}
                placeholder="이메일 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>

          {/* 연락처 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              연락처
            </label>
            <div className="relative">
              <input
                type="text"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={handleKeyPress}
                placeholder="연락처 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Phone
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
          </div>
        </div>

        {/* 필터 액션 */}
        <div className="flex justify-end mt-4 gap-4">
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <X size={16} />
            <span>필터 초기화</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            <span>담당자 추가</span>
          </button>
        </div>
      </div>

      {/* 테이블 컨트롤 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          총 <span className="font-semibold text-blue-600">{total}</span>명의
          담당자
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

      {/* 담당자 테이블 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
        {contacts && contacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    거래처명
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    담당자
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    직급
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                  >
                    이메일
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    연락처
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    수정
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    삭제
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact: Contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                        onClick={() =>
                          router.push(`/consultations/${contact.company_id}`)
                        }
                      >
                        {contact.companies?.name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                        onClick={() =>
                          router.push(`/manage/contacts/${contact.id}`)
                        }
                      >
                        {contact.contact_name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contact.level || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-gray-900">
                        {contact.email || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contact.mobile || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                        title="수정"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleDeleteContact(contact)}
                        className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Search size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
            <p className="text-gray-400 text-sm mt-2">
              다른 검색어로 시도해보세요
            </p>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-md ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronLeft size={18} />
            </button>

            {paginationNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === "number" && setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-md ${
                  currentPage === page
                    ? "bg-blue-600 text-white font-medium"
                    : page === "..."
                    ? "text-gray-500 cursor-default"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`p-2 rounded-md ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </nav>
        </div>
      )}

      {/* 담당자 추가 모달 */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <motion.div
                className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-50"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        담당자 추가
                      </h3>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* 거래처명 */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            거래처명 <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              ref={inputRef}
                              type="text"
                              placeholder="거래처명 입력"
                              value={inputCompanyName}
                              onChange={(e) =>
                                setInputCompanyName(e.target.value)
                              }
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Building
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />

                            {isDropdownOpen && (
                              <ul
                                ref={dropdownRef}
                                className="absolute left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 z-10 shadow-lg max-h-36 overflow-y-auto"
                              >
                                {filteredCompanies.map((company: any) => (
                                  <li
                                    key={company.id}
                                    className="p-2 cursor-pointer hover:bg-gray-100"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setInputCompanyName(company.name);
                                      setIsDropdownOpen(false);
                                    }}
                                  >
                                    {company.name}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        {/* 담당자명 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            담당자명 <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={modalContactName}
                              onChange={(e) =>
                                setModalContactName(e.target.value)
                              }
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="담당자명 입력"
                            />
                            <User
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>
                        </div>

                        {/* 직급 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            직급
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={modalLevel}
                              onChange={(e) => setModalLevel(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="직급 입력"
                            />
                            <Briefcase
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>
                        </div>

                        {/* 부서 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            부서
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={modalDepartment}
                              onChange={(e) =>
                                setModalDepartment(e.target.value)
                              }
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="부서 입력"
                            />
                            <Building
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>
                        </div>

                        {/* 이메일 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            이메일
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              value={modalEmail}
                              onChange={(e) => setModalEmail(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="이메일 입력"
                            />
                            <Mail
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>
                        </div>

                        {/* 연락처 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            연락처
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={modalMobile}
                              onChange={(e) => setModalMobile(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="000-0000-0000"
                            />
                            <Phone
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>
                        </div>

                        {/* 비고 */}
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            비고
                          </label>
                          <textarea
                            value={modalNotes}
                            onChange={(e) => setModalNotes(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="담당자에 대한 추가 정보를 입력하세요."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleAddContact}
                    disabled={saving}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {saving ? (
                      <>
                        <CircularProgress size={18} className="mr-2" />
                        저장 중...
                      </>
                    ) : (
                      "저장"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      resetModalFields();
                    }}
                    disabled={saving}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    취소
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 담당자 수정 모달 */}
      <AnimatePresence>
        {isModalOpen && selectedContact && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <motion.div
                className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-50"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <Edit className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        담당자 수정
                      </h3>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* 거래처명 (수정 불가) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            거래처명
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={inputCompanyName}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                              disabled
                            />
                            <Building
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>
                        </div>

                        {/* 담당자명 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            담당자명 <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={modalContactName}
                              onChange={(e) =>
                                setModalContactName(e.target.value)
                              }
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="담당자명 입력"
                            />
                            <User
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>
                        </div>

                        {/* 직급 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            직급
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={modalLevel}
                              onChange={(e) => setModalLevel(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="직급 입력"
                            />
                            <Briefcase
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>
                        </div>

                        {/* 부서 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            부서
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={modalDepartment}
                              onChange={(e) =>
                                setModalDepartment(e.target.value)
                              }
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="부서 입력"
                            />
                            <Building
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>
                        </div>

                        {/* 이메일 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            이메일
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              value={modalEmail}
                              onChange={(e) => setModalEmail(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="이메일 입력"
                            />
                            <Mail
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>
                        </div>

                        {/* 연락처 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            연락처
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={modalMobile}
                              onChange={(e) => setModalMobile(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="000-0000-0000"
                            />
                            <Phone
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                              size={18}
                            />
                          </div>
                        </div>

                        {/* 비고 */}
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            비고
                          </label>
                          <textarea
                            value={modalNotes}
                            onChange={(e) => setModalNotes(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="담당자에 대한 추가 정보를 입력하세요."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleUpdateContact}
                    disabled={saving}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {saving ? (
                      <>
                        <CircularProgress size={18} className="mr-2" />
                        저장 중...
                      </>
                    ) : (
                      "수정"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedContact(null);
                      resetModalFields();
                    }}
                    disabled={saving}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    취소
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 삭제 확인 모달 */}
      <AnimatePresence>
        {openDeleteModal && contactToDelete && (
          <motion.div
            className="fixed inset-0 z-50 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <motion.div
                className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-50"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        담당자 삭제 요청
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold text-gray-700">
                            {contactToDelete.contact_name}
                          </span>{" "}
                          담당자를 삭제 요청하시겠습니까? 이 작업은 관리자 승인
                          후 완료됩니다.
                        </p>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            삭제 사유 <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="삭제 사유를 입력해주세요."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={!deleteReason}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${
                      !deleteReason ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    삭제 요청
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDeleteModal(false);
                      setContactToDelete(null);
                      setDeleteReason("");
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    취소
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 스낵바 */}
      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
