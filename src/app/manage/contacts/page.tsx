"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Snackbar,
  TextField,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

interface Company {
  id: string;
  name: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactName, setContactName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const contactsPerPage = 10;
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // 추가 모달 상태
  const [openSnackbar, setOpenSnackbar] = useState(false); // 스낵바 상태
  const [snackbarMessage, setSnackbarMessage] = useState<string>(""); // 스낵바 메시지
  const [saving, setSaving] = useState(false); // 🔹 저장 로딩 상태 추가
  const dropdownRef = useRef<HTMLDivElement>(null); // 🔹 드롭다운 감지용 ref
  const inputRef = useRef<HTMLInputElement>(null); // 🔹 인풋 감지용 ref

  // 🔹 모달에서 입력할 상태 (검색 필드와 분리)
  const [modalContactName, setModalContactName] = useState("");
  const [modalDepartment, setModalDepartment] = useState("");
  const [modalLevel, setModalLevel] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [modalMobile, setModalMobile] = useState("");
  const [modalNotes, setModalNotes] = useState(""); // 🔹 비고 필드 추가

  const [inputCompanyName, setInputCompanyName] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  // 🔹 검색 실행
  const fetchContacts = useCallback(
    async (pageNumber: number) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/manage/contacts?page=${pageNumber}&limit=${contactsPerPage}&contact=${contactName}&email=${email}&mobile=${mobile}`
        );

        const { contacts: fetchedContacts, total } = await response.json();

        setTotalPages(Math.ceil(total / contactsPerPage));
        setContacts(fetchedContacts);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    },
    [contactName, email, mobile]
  );

  async function fetchCompanies() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name");
      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setFilteredCompanies([]); // 🔹 드롭다운 닫기
      }
    }
    fetchCompanies();
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 🔹 거래처명 입력 시 드롭다운 필터링
  useEffect(() => {
    if (inputCompanyName) {
      setFilteredCompanies(
        companies.filter((c) => c.name.includes(inputCompanyName))
      );
    } else {
      setFilteredCompanies([]);
    }
  }, [inputCompanyName, companies]);

  async function handleAddContact() {
    if (!inputCompanyName.trim()) {
      setOpenSnackbar(true);
      setSnackbarMessage("거래처명을 입력해주세요.");
      return;
    }

    const matchedCompany = companies.find((c) => c.name === inputCompanyName);
    if (!matchedCompany) {
      setOpenSnackbar(true);
      setSnackbarMessage("존재하지 않는 거래처명입니다.");
      return;
    }

    if (!modalContactName.trim()) {
      setOpenSnackbar(true);
      setSnackbarMessage("담당자 이름을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("contacts").insert([
        {
          contact_name: modalContactName,
          email: modalEmail,
          mobile: modalMobile,
          level: modalLevel,
          department: modalDepartment,
          company_id: matchedCompany.id,
          note: modalNotes,
        },
      ]);

      if (error) throw error;

      setOpenSnackbar(true);
      setSnackbarMessage("담당자가 추가되었습니다");
      setIsAddModalOpen(false);
      setModalContactName("");
      setModalEmail("");
      setModalMobile("");
      setModalLevel("");
      setModalDepartment("");
      setModalNotes("");
      setInputCompanyName("");
      setSelectedCompany(null);
      fetchCompanies(); // 다시 거래처 목록 불러오기
    } catch (error) {
      console.error("Error adding contact:", error);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    fetchContacts(currentPage);
  }, [currentPage]);

  const paginationNumbers = () => {
    let pageNumbers = [];
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

  return (
    <div className="text-sm text-[#37352F]">
      <p className="mb-4 font-semibold">담당자 관리</p>

      {/* 🔹 검색 필드 */}
      <div className="bg-[#FBFBFB] rounded-md border-[1px] p-4 grid grid-cols-1 lg:grid-cols-5 gap-4">
        <TextField
          label="담당자명"
          variant="outlined"
          size="small"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
        />
        <TextField
          label="이메일"
          variant="outlined"
          size="small"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="연락처"
          variant="outlined"
          size="small"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            variant="contained"
            color="primary"
            onClick={() => fetchContacts(1)}
          >
            검색
          </Button>
        </div>
      </div>

      <button
        className="px-3 py-1 text-xs md:text-sm rounded-md hover:bg-gray-300"
        onClick={() => setIsAddModalOpen(true)}
      >
        + 추가
      </button>

      {/* 🔹 리스트 테이블 */}
      <div className="overflow-x-auto mt-4">
        {loading ? (
          // 🔥 스켈레톤 UI 추가
          <div className="space-y-2">
            {[...Array(10)].map((_, index) => (
              <div
                key={index}
                className="animate-pulse bg-gray-200 h-10 w-full rounded"
              ></div>
            ))}
          </div>
        ) : (
          <table className="min-w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2 border-b">거래처</th>
                <th className="px-4 py-2 border-b">담당자명</th>
                <th className="px-4 py-2 border-b">부서</th>
                <th className="px-4 py-2 border-b">직급</th>
                <th className="px-4 py-2 border-b">이메일</th>
                <th className="px-4 py-2 border-b">연락처</th>
                <th className="px-4 py-2 border-b">비고</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">
                    {contact.companies.name}
                  </td>
                  <td
                    className="px-4 py-2 border-b text-blue-500 cursor-pointer"
                    onClick={() =>
                      router.push(`/manage/contacts/${contact.id}`)
                    }
                  >
                    {contact.contact_name}
                  </td>
                  <td className="px-4 py-2 border-b">{contact.department}</td>
                  <td className="px-4 py-2 border-b">{contact.level}</td>
                  <td className="px-4 py-2 border-b">{contact.email}</td>
                  <td className="px-4 py-2 border-b">{contact.mobile}</td>
                  <td className="px-4 py-2 border-b">{contact.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

        {paginationNumbers().map((page, index) => (
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
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
        >
          다음
        </button>
      </div>
      {isAddModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50 px-2">
          <div
            className="bg-white p-6 rounded-md 
                  w-11/12 md:w-2/3
                  min-h-96
                  max-h-96 md:max-h-max-h-96
                  overflow-y-auto"
          >
            <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
              담당자 추가
            </h3>

            {/* 📌 거래처 입력 필드 (드롭다운 자동 검색) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="relative mb-2" ref={dropdownRef}>
                  <label className="block mb-1">거래처명</label>
                  <input
                    ref={inputRef} // 🔹 인풋 감지 ref 추가
                    type="text"
                    value={inputCompanyName}
                    onChange={(e) => setInputCompanyName(e.target.value)}
                    onFocus={() => setFilteredCompanies(companies)} // 🔹 입력 필드 클릭 시 드롭다운 다시 열기
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                  {filteredCompanies.length > 0 && (
                    <ul className="absolute left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 z-10 shadow-lg overflow-y-scroll max-h-36">
                      {filteredCompanies.map((company) => (
                        <li
                          key={company.id}
                          className="p-2 cursor-pointer hover:bg-gray-100"
                          onMouseDown={(e) => {
                            e.preventDefault(); // 🔹 클릭 시 자동 포커스 해제 방지
                            setInputCompanyName(company.name);
                            setSelectedCompany(company);
                            setTimeout(() => setFilteredCompanies([]), 100); // 🔹 드롭다운 즉시 닫기
                          }}
                        >
                          {company.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mb-2">
                  <label className="block mb-1">비고</label>
                  <textarea
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md h-24"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1">담당자명</label>
                  <input
                    type="text"
                    value={modalContactName}
                    onChange={(e) => setModalContactName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block mb-1">부서</label>
                  <input
                    type="text"
                    value={modalDepartment}
                    onChange={(e) => setModalDepartment(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block mb-1">직급</label>
                  <input
                    type="text"
                    value={modalLevel}
                    onChange={(e) => setModalLevel(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block mb-1">이메일</label>
                  <input
                    type="email"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block mb-1">연락처</label>
                  <input
                    type="text"
                    value={modalMobile}
                    onChange={(e) => setModalMobile(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
            {/* 버튼 영역 */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className={`bg-gray-500 text-white px-4 py-2 rounded-md ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={handleAddContact}
                className={`bg-blue-500 text-white px-4 py-2 rounded-md flex items-center ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={saving}
              >
                저장
                {saving && <CircularProgress size={18} className="ml-2" />}
              </button>
            </div>
          </div>
        </div>
      )}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{
          vertical: "bottom", // 하단
          horizontal: "right", // 오른쪽
        }}
      >
        <Alert severity="success">{snackbarMessage}</Alert>
      </Snackbar>
    </div>
  );
}
