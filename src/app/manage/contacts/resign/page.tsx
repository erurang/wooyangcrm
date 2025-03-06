"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";

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
  const [companyName, setCompanyName] = useState<string>(""); // 🔹 회사명 추가
  const [deleteReason, setDeleteReason] = useState("");
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const [contactName, setContactName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [contactsPerPage, setContactsPerPage] = useState(10);
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // 추가 모달 상태
  const [snackbarMessage, setSnackbarMessage] = useState<string>(""); // 스낵바 메시지
  const [saving, setSaving] = useState(false); // 🔹 저장 로딩 상태 추가
  const dropdownRef = useRef<HTMLUListElement | null>(null); // ✅ 수정
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 🔹 모달에서 입력할 상태 (검색 필드와 분리)
  const [modalContactName, setModalContactName] = useState("");
  const [modalDepartment, setModalDepartment] = useState("");
  const [modalLevel, setModalLevel] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalMobile, setModalMobile] = useState("");
  const [modalNotes, setModalNotes] = useState(""); // 🔹 비고 필드 추가

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
  //

  //// swr ///
  const { companies } = useCompanySearch(inputCompanyName);
  const { contacts, total, refreshContacts } = useContactsList(
    currentPage,
    contactsPerPage,
    debouncedContactNameTerm,
    debouncedEmailTerm,
    debouncedMobileTerm,
    debouncedCompanyNameTerm,
    "true"
  );

  const { addContacts } = useAddContacts();
  const { updateContacts } = useUpdateContacts();
  const { deleteContact } = useDeleteContact();

  //// swr ///
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
        setIsDropdownOpen(false); // ✅ 드롭다운 닫기
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false); // ✅ ESC 키로 드롭다운 닫기
        setIsAddModalOpen(false);
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 🔹 거래처명 입력 시 드롭다운 열기
  useEffect(() => {
    setIsDropdownOpen(filteredCompanies.length > 0);
  }, [filteredCompanies]);

  const paginationNumbers = () => {
    let pageNumbers = [];
    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pageNumbers.push(i);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        pageNumbers.push("...");
      }
    }
    return pageNumbers;
  };

  // 🔹 수정 버튼 클릭 시 기존 데이터 불러오기
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
            resign: false,
          },
        ],
        selectedContact.company_id
      );
      await refreshContacts();

      setSnackbarMessage("담당자 정보가 수정되었습니다.");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating contact:", error);
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
      }
    } catch (error) {
      setSnackbarMessage("삭제 요청 생성 중 오류가 발생했습니다.");
    }
  };

  // const handleDeleteContact = async (contactId: string) => {
  //   const isConfirmed = confirm(
  //     "정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
  //   );
  //   if (!isConfirmed) return; // ✅ confirm이 true일 때만 실행

  //   setSaving(true);

  //   try {
  //     await deleteContact(contactId);
  //     setSnackbarMessage("담당자가 삭제되었습니다.");
  //     await refreshContacts();
  //   } catch (error) {
  //     console.error("Error deleting contact:", error);
  //     setSnackbarMessage("❌ 삭제 실패: " + error);
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  return (
    <div className="text-sm text-[#37352F]">
      <p className="mb-4 font-semibold">퇴사자 검색</p>

      {/* 🔹 검색 필드 */}
      <div className="bg-[#FBFBFB] rounded-md border-[1px] p-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="flex items-center justify-center">
          <label className="w-1/4 block p-2 border rounded-l-md">
            거래처명
          </label>
          <motion.input
            placeholder="거래처명"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-3/4 p-2 border rounded-r-md"
            whileFocus={{
              scale: 1.05,
              boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)",
            }}
          />
        </div>
        <div className="flex items-center justify-center">
          <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
            담당자명
          </label>
          <motion.input
            placeholder="담당자명"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
            whileFocus={{
              scale: 1.05, // 입력 시 약간 확대
              boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
            }}
          />
        </div>
        <div className="flex items-center justify-center">
          <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
            이메일
          </label>
          <motion.input
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
            whileFocus={{
              scale: 1.05, // 입력 시 약간 확대
              boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
            }}
          />
        </div>
        <div className="flex items-center justify-center">
          <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
            연락처
          </label>
          <motion.input
            placeholder="연락처"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
            whileFocus={{
              scale: 1.05, // 입력 시 약간 확대
              boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
            }}
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              setEmail("");
              setMobile("");
              setContactName("");
              setCompanyName("");
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-md"
          >
            필터리셋
          </button>
        </div>
      </div>

      {/* 🔹 리스트 테이블 */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {contacts?.map((contact: any) => (
          <div
            key={contact.id}
            className="bg-white rounded-lg border shadow-sm p-6 relative overflow-hidden flex flex-col justify-between transition-all hover:shadow-md"
          >
            
            <div className="absolute top-3 right-4 flex space-x-2 text-sm">
              <button
                className="text-gray-500 hover:text-blue-500"
                onClick={() => handleEditContact(contact)}
              >
                수정
              </button>
              <button
                className="text-gray-500 hover:text-red-500"
                onClick={() => handleDeleteContact(contact.id)}
              >
                삭제
              </button>
            </div>

            
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-bold text-gray-700">
                {contact.contact_name[0]}
              </div>
              <div>
                <p
                  className="text-xl font-bold text-blue-500 cursor-pointer"
                  // onClick={() => router.push(`/manage/contacts/${contact.id}`)}
                >
                  {contact.contact_name || "이름을 재설정해주세요"}
                </p>
                <p className="text-gray-500 text-sm">
                  {contact.level || "직급 없음"}
                </p>
              </div>
            </div>

            
            <p className="text-gray-700 font-semibold text-sm bg-gray-100 px-2 py-1 rounded-md w-fit">
              {contact.companies?.name || "거래처 없음"}
            </p>

            
            <div className="grid grid-cols-2 gap-4">
              <div className="mt-4 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-800">부서:</span>{" "}
                  {contact.department || "없음"}
                </p>
                <p>
                  <span className="font-medium text-gray-800">이메일:</span>{" "}
                  {contact.email || "없음"}
                </p>
                <p>
                  <span className="font-medium text-gray-800">연락처:</span>{" "}
                  {contact.mobile || "없음"}
                </p>
              </div>

              
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium text-gray-800">비고:</p>
                <div
                  className="max-h-28 overflow-y-auto rounded-md  text-gray-700"
                  style={{ wordBreak: "break-word" }} // 긴 단어 줄바꿈 방지
                >
                  {contact.note || "없음"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div> */}
      <div>
        <div className="flex justify-between items-center my-4">
          {/* <div className="flex">
            <button
              className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
              onClick={() => setIsAddModalOpen(true)}
            >
              <span className="mr-2">+</span>
              <span>추가</span>
            </button>
          </div> */}
          <div></div>

          <div className="flex items-center">
            <label className="mr-2 text-sm text-gray-600">표시 개수:</label>
            <select
              value={contactsPerPage}
              onChange={(e) => {
                setContactsPerPage(Number(e.target.value));
                setCurrentPage(1); // ✅ 페이지 변경 시 첫 페이지로 이동
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

        <div className="bg-[#FBFBFB] rounded-md border">
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 text-center">
                <th className="px-4 py-2 border-b border-r w-2/12">거래처명</th>
                <th className="px-4 py-2 border-b border-r w-1/12">담당자명</th>
                <th className="px-4 py-2 border-b border-r w-1/12">직급</th>
                <th className="px-4 py-2 border-b border-r w-1/12">부서</th>
                <th className="px-4 py-2 border-b border-r w-2/12">이메일</th>
                <th className="px-4 py-2 border-b border-r w-2/12">연락처</th>
                {/* <th className="px-4 py-2 border-b border-r w-1/4">비고</th> */}
                <th className="px-4 py-2 border-b border-r w-1/12">퇴사</th>
                <th className="px-4 py-2 border-b w-1/12">삭제</th>
              </tr>
            </thead>
            <tbody>
              {contacts?.map((contact: any) => (
                <tr key={contact.id} className="hover:bg-gray-100 text-center">
                  <td
                    className="px-4 py-2 border-b border-r text-blue-500 cursor-pointer"
                    onClick={() =>
                      router.push(`/consultations/${contact.company_id}`)
                    }
                  >
                    {contact.companies?.name}
                  </td>
                  <td
                    className="px-4 py-2 border-b border-r text-blue-500 cursor-pointer"
                    onClick={() =>
                      router.push(`/manage/contacts/${contact.id}`)
                    }
                  >
                    {contact.contact_name}
                  </td>
                  <td className="px-4 py-2 border-b border-r">
                    {contact.level}
                  </td>
                  <td className="px-4 py-2 border-b border-r">
                    {contact.department}
                  </td>
                  <td className="px-4 py-2 border-b border-r">
                    {contact.email}
                  </td>
                  <td className="px-4 py-2 border-b border-r">
                    {contact.mobile}
                  </td>
                  {/* <td
                    style={{
                      minHeight: "8rem",
                      maxHeight: "8rem",
                      overflowY: "auto",
                      display: "block",
                    }}
                    className="px-4 py-2 border-b border-r"
                  >
                    {contact.note}
                  </td> */}
                  <td
                    className="px-4 py-2 border-b border-r text-blue-500 cursor-pointer"
                    onClick={() => handleEditContact(contact)}
                  >
                    변경
                  </td>
                  <td
                    className="px-4 py-2 border-b text-red-500 cursor-pointer hidden md:table-cell"
                    onClick={() => handleDeleteContact(contact)}
                  >
                    삭제
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔹 페이지네이션 UI */}
      <div className="flex justify-center mt-4 overflow-x-auto space-x-1 md:space-x-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
        >
          이전
        </button>

        {paginationNumbers()?.map((page, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(Number(page))}
            className={`px-3 py-1 border rounded ${
              currentPage === page
                ? "bg-blue-500 text-white font-bold"
                : "bg-gray-50 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, total))}
          disabled={currentPage === total}
          className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
        >
          다음
        </button>
      </div>

      {isModalOpen && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50 px-2"
          >
            <div className="bg-white p-6 rounded-md w-1/6 overflow-y-auto">
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
                퇴사 상태 변경
              </h3>
              <p className="text-center">재직으로 상태를 변경할까요?</p>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md"
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={() => handleUpdateContact()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center"
                  disabled={saving}
                >
                  {saving ? (
                    <CircularProgress size={18} className="ml-2" />
                  ) : selectedContact ? (
                    "수정"
                  ) : (
                    "변경"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {openDeleteModal && contactToDelete && (
        <motion.div
          initial={{ opacity: 0, scale: 1 }} // 시작 애니메이션
          animate={{ opacity: 1, scale: 1 }} // 나타나는 애니메이션
          exit={{ opacity: 0, scale: 1 }} // 사라질 때 애니메이션
          transition={{ duration: 0.3 }}
          className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50"
        >
          <div className="bg-white p-6 rounded-md w-1/3">
            <h3 className="text-xl font-semibold mb-4">삭제 요청</h3>
            <textarea
              className="w-full border rounded-md p-4 h-48"
              placeholder="삭제 사유를 입력해주세요."
              onChange={(e) => setDeleteReason(e.target.value)}
            />

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setOpenDeleteModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
              >
                삭제
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
