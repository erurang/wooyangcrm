"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CircularProgress } from "@mui/material"; // MUI Snackbar 임포트
import { useRouter } from "next/navigation";

import SnackbarComponent from "@/components/Snackbar";
import { useDebounce } from "@/hooks/useDebounce";
import { useLoginUser } from "@/context/login";
import { useOrgsList } from "@/hooks/manage/(rnds)/orgs/useOrgsList";
import { useAddOrgs } from "@/hooks/manage/(rnds)/orgs/useAddOrgs";
import { useUpdateOrgs } from "@/hooks/manage/(rnds)/orgs/useUpdateOrgs";
import { useAddOrgsContacts } from "@/hooks/manage/(rnds)/orgs/useAddOrgsContacts";

interface RnDsOrgs {
  id: string;
  name: string;
  address: string;
  notes: string;
  phone: string;
  fax: string;
  email: string;
  RnDs_contacts: Contact[];
}

interface Contact {
  id?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  level: string;
}

export default function Page() {
  const user = useLoginUser();
  const [searchTerm, setSearchTerm] = useState<string>(""); // 거래처 검색어
  const [saving, setSaving] = useState(false); // 🔹 저장 로딩 상태 추가
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 상태
  const [totalPages, setTotalPages] = useState(1); // 총 페이지 수
  const [rndsPerPage, setRndsPerPage] = useState(10);
  const [deleteReason, setDeleteReason] = useState("");

  const router = useRouter();

  // 토스트 관련 상태
  const [snackbarMessage, setSnackbarMessage] = useState<string>(""); // 스낵바 메시지

  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // 추가 모달 상태
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // 삭제 모달 상태
  const [currentRndsOrgs, setCurrentRndsOrgs] = useState<RnDsOrgs>({
    id: "", // id 필드 반드시 문자열로 초기화
    name: "",
    address: "",
    email: "",
    fax: "",
    notes: "",
    phone: "",
    RnDs_contacts: [], // 🔥담당자 배열 초기화 추가
  }); // 현재 거래처 정보

  const [rndsToDelete, setRndsToDelete] = useState<RnDsOrgs | null>(null); // 삭제할 거래처 정보

  // debounce
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  //// Swr test ////

  const { orgs, isLoading, refreshOrgs, total, isError } = useOrgsList(
    currentPage,
    rndsPerPage,
    debouncedSearchTerm
  );

  const { addOrgs } = useAddOrgs();
  const { addContacts } = useAddOrgsContacts();
  const { updateOrgs } = useUpdateOrgs();

  //// swr test ////

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

  // 페이징 정보 업데이트
  useEffect(() => {
    if (!isLoading && !isError && orgs) {
      setTotalPages(Math.ceil(total / rndsPerPage));
    }
  }, [orgs, total, isLoading, isError]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isModalOpen) closeModal();
        if (isAddModalOpen) closeAddModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, isAddModalOpen]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setCurrentPage(1); // 1페이지로 이동
    }
  };

  // api추가
  const handleAddOrgs = async () => {
    if (!currentRndsOrgs.name) {
      setSnackbarMessage("기관명을 입력해주세요.");
      return;
    }

    if (currentRndsOrgs.RnDs_contacts.length === 0) {
      setSnackbarMessage("담당자를 최소 1명 입력해주세요.");
      return;
    }

    setSaving(true);

    try {
      const orgData = await addOrgs(currentRndsOrgs);
      await addContacts(currentRndsOrgs.RnDs_contacts, orgData.id);
      await refreshOrgs();

      setSnackbarMessage("지원기관 추가 완료");
      closeAddModal();
    } catch (error) {
      console.error("Error adding orgs:", error);
      setSnackbarMessage("지원기관 추가 실패");
    } finally {
      setSaving(false);
    }
  };
  const handleSave = async () => {
    if (!currentRndsOrgs.name) {
      setSnackbarMessage("기관명을 입력해주세요.");
      return;
    }

    if (currentRndsOrgs.RnDs_contacts.length === 0) {
      setSnackbarMessage("담당자를 최소 1명 입력해주세요.");
      return;
    }

    setSaving(true);

    try {
      await updateOrgs({
        ...currentRndsOrgs,
        RnDs_contacts: currentRndsOrgs.RnDs_contacts, // 🔥 담당자 데이터 포함
      });

      setSnackbarMessage("지원기관 수정 완료");
      await refreshOrgs();
      closeModal();
    } catch (error) {
      console.error("Error updating orgs:", error);
      setSnackbarMessage("지원기관 수정 실패");
    } finally {
      setSaving(false);
    }
  };
  //

  // 회사 ui삭제관련
  // 삭제 버튼 클릭 시 삭제 요청 처리
  const handleDelete = (rnds: RnDsOrgs) => {
    setRndsToDelete(rnds);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteReason.length === 0) return;
    if (rndsToDelete) {
      try {
        // 2️⃣ 회사 삭제 요청 추가
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
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setRndsToDelete(null);
  };

  // 모달 관련
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setCurrentRndsOrgs({
      id: "", // id 필드 반드시 문자열로 초기화
      name: "",
      address: "",
      email: "",
      fax: "",
      notes: "",
      phone: "",
      RnDs_contacts: [], // 🔥담당자 배열 초기화 추가
    });
  };
  // 추가 버튼 클릭 시 모달 열기
  const handleAdd = () => {
    setCurrentRndsOrgs({
      id: "", // id 필드 반드시 문자열로 초기화
      name: "",
      address: "",
      email: "",
      fax: "",
      notes: "",
      phone: "",
      RnDs_contacts: [], // 🔥담당자 배열 초기화 추가
    });
    setIsAddModalOpen(true); // 추가 모달 열기
  };

  // 수정 버튼 클릭 시 모달 열기
  const handleEdit = (orgs: RnDsOrgs) => {
    try {
      setCurrentRndsOrgs({
        id: orgs.id,
        name: orgs.name || "",
        address: orgs.address || "",
        email: orgs.email || "",
        fax: orgs.fax || "",
        notes: orgs.notes || "",
        phone: orgs.phone || "",
        RnDs_contacts:
          orgs.RnDs_contacts?.map((contact: any) => ({
            id: contact.id || "",
            name: contact.name || "",
            phone: contact.phone || "",
            email: contact.email || "",
            department: contact.department || "",
            level: contact.level || "",
          })) || [], // 담당자 초기화
      });

      setIsModalOpen(true);
    } catch (error) {
      console.error("Error in handleEdit:", error);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRndsOrgs({
      id: "", // id 필드 반드시 문자열로 초기화
      name: "",
      address: "",
      email: "",
      fax: "",
      notes: "",
      phone: "",
      RnDs_contacts: [], // 🔥담당자 배열 초기화 추가
    });
  };
  /// contact

  const addContact = () => {
    setCurrentRndsOrgs((prev) => ({
      ...prev,
      RnDs_contacts: [
        {
          name: "",
          phone: "",
          department: "",
          level: "",
          email: "",
        },
        ...prev.RnDs_contacts,
      ],
    }));
  };

  const handleContactChange = (
    index: number,
    field: keyof Contact,
    value: any
  ) => {
    setCurrentRndsOrgs((prev) => {
      const updatedContact = [...prev.RnDs_contacts];
      updatedContact[index] = { ...updatedContact[index], [field]: value };
      return { ...prev, RnDs_contacts: updatedContact };
    });
  };
  const removeContact = (index: number) => {
    setCurrentRndsOrgs((prev) => {
      const updatedContact = [...prev.RnDs_contacts];
      updatedContact.splice(index, 1);
      return { ...prev, RnDs_contacts: updatedContact };
    });
  };

  ///

  return (
    <div className="text-sm text-[#37352F]">
      <p className="mb-4 font-semibold">지원기관 검색</p>

      <div className="bg-[#FBFBFB] rounded-md border-[1px] p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="flex items-center justify-center">
          <label className="w-1/4 block p-2 border-t-[1px] border-b-[1px] border-r-[1px] border-l-[1px] rounded-l-md">
            기관명
          </label>
          <motion.input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            onKeyDown={handleKeyPress} // 🔹 Enter 누르면 검색 실행
            placeholder="기관명"
            className="w-3/4 p-2 border-r-[1px] border-t-[1px] border-b-[1px] border-gray-300 rounded-r-md"
            whileFocus={{
              scale: 1.05, // 입력 시 약간 확대
              boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
            }}
          />
        </div>
        <div></div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              setSearchTerm("");
              setCurrentPage(1); // 페이지 초기화
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-md"
          >
            필터리셋
          </button>
        </div>
      </div>

      <div>
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
                <th className="px-4 py-2 border-b border-r-[1px] w-3/12">
                  기관명
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell w-2/12">
                  주소
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell w-2/12">
                  번호
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell w-2/12">
                  팩스
                </th>
                <th className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell w-2/12">
                  이메일
                </th>
                <th className="px-4 py-2 border-b border-r-[1px]">수정</th>
                <th className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
                  삭제
                </th>
              </tr>
            </thead>
            <tbody>
              {orgs?.map((orgs: any) => (
                <tr key={orgs.id} className="hover:bg-gray-100 text-center">
                  <td
                    className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer "
                    // onClick={() => router.push(`/manage/orgs/${orgs.id}`)}
                  >
                    {orgs.name}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px] hidden md:table-cell">
                    {orgs.address}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                    {orgs.phone}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                    {orgs.fax}
                  </td>
                  <td className="px-4 py-2 border-b border-r-[1px] hidden lg:table-cell">
                    {orgs.email}
                  </td>
                  <td
                    className="px-4 py-2 border-b border-r-[1px] text-blue-500 cursor-pointer"
                    onClick={() => handleEdit(orgs)}
                  >
                    수정
                  </td>
                  <td
                    className="px-4 py-2 border-b border-r-[1px] text-red-500 cursor-pointer hidden md:table-cell"
                    onClick={() => handleDelete(orgs)}
                  >
                    삭제
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모달 */}
      <AnimatePresence>
        {isModalOpen && currentRndsOrgs && (
          <motion.div
            className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50 px-2"
            initial={{ opacity: 0, scale: 1 }} // 시작 애니메이션
            animate={{ opacity: 1, scale: 1 }} // 나타나는 애니메이션
            exit={{ opacity: 0, scale: 1 }} // 사라질 때 애니메이션
            transition={{ duration: 0.3 }}
          >
            <div
              className="bg-white p-6 rounded-md 
                    w-11/12 md:w-2/3 
                    max-h-[75vh] md:max-h-[85vh] 
                    overflow-y-auto"
            >
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
                지원기관 수정
              </h3>

              {/* 📌 반응형: 모바일 1열, 데스크톱 4열 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="mb-2">
                  <label className="block mb-1">기관명</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                    }}
                    type="text"
                    value={currentRndsOrgs.name || ""}
                    onChange={(e) =>
                      setCurrentRndsOrgs({
                        ...currentRndsOrgs,
                        name: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">주소</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                    }}
                    type="text"
                    value={currentRndsOrgs?.address || ""}
                    onChange={(e) => {
                      setCurrentRndsOrgs({
                        ...currentRndsOrgs,
                        address: e.target.value,
                      });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-2">
                  <label className="block mb-1">번호</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                    }}
                    value={currentRndsOrgs?.phone}
                    type="text"
                    onChange={(e) =>
                      setCurrentRndsOrgs({
                        ...currentRndsOrgs,
                        phone: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">팩스</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                    }}
                    placeholder=""
                    type="text"
                    value={currentRndsOrgs?.fax || ""}
                    onChange={(e) => {
                      setCurrentRndsOrgs({
                        ...currentRndsOrgs,
                        fax: e.target.value,
                      });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">이메일</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                    }}
                    type="email"
                    value={currentRndsOrgs?.email}
                    onChange={(e) =>
                      setCurrentRndsOrgs({
                        ...currentRndsOrgs,
                        email: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <label className="block mb-1">담당자</label>
                  <button
                    className="px-3 py-1 bg-gray-200 text-xs md:text-sm rounded-md hover:bg-gray-300"
                    onClick={addContact}
                  >
                    + 추가
                  </button>
                </div>

                <div className="space-y-2">
                  {currentRndsOrgs.RnDs_contacts?.map((contact, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap md:flex-nowrap gap-2"
                    >
                      <motion.input
                        type="text"
                        placeholder="이름"
                        value={contact.name || ""}
                        onChange={(e) =>
                          handleContactChange(index, "name", e.target.value)
                        }
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        type="text"
                        placeholder="휴대폰"
                        value={contact.phone || ""}
                        onChange={(e) =>
                          handleContactChange(index, "phone", e.target.value)
                        }
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        type="text"
                        placeholder="부서"
                        value={contact.department || ""}
                        onChange={(e) =>
                          handleContactChange(
                            index,
                            "department",
                            e.target.value
                          )
                        }
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        type="text"
                        placeholder="직급"
                        value={contact.level || ""}
                        onChange={(e) =>
                          handleContactChange(index, "level", e.target.value)
                        }
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        type="email"
                        placeholder="이메일"
                        value={contact.email || ""}
                        onChange={(e) =>
                          handleContactChange(index, "email", e.target.value)
                        }
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <button
                        onClick={() => removeContact(index)}
                        className="px-4 py-2 bg-red-500 text-white text-xs md:text-sm rounded-md"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 비고 */}
              <div className="mb-2">
                <label className="block mb-1">비고</label>
                <textarea
                  placeholder=""
                  value={currentRndsOrgs.notes || ""}
                  onChange={(e) =>
                    setCurrentRndsOrgs({
                      ...currentRndsOrgs,
                      notes: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md min-h-52"
                ></textarea>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeModal}
                  className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className={`bg-blue-500 text-white px-4 py-2 rounded-md text-xs md:text-sm flex items-center ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={saving}
                >
                  저장
                  {saving && <CircularProgress size={18} className="ml-2" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
        {/* 삭제 확인 모달 */}

        {isDeleteModalOpen && rndsToDelete && (
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
                  onClick={cancelDelete}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md"
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-500 text-white px-4 py-2 rounded-md"
                >
                  삭제
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 추가 모달 */}
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 1 }} // 시작 애니메이션
            animate={{ opacity: 1, scale: 1 }} // 나타나는 애니메이션
            exit={{ opacity: 0, scale: 1 }} // 사라질 때 애니메이션
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50 px-2"
          >
            <div
              className="bg-white p-6 rounded-md 
                  w-11/12 md:w-2/3 
                  max-h-[75vh] md:max-h-[85vh] 
                  overflow-y-auto"
            >
              <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">
                지원기관 추가
              </h3>

              {/* 📌 반응형: 모바일 2열, 데스크톱 4열 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="mb-2">
                  <label className="block mb-1">기관명</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                    }}
                    type="text"
                    value={currentRndsOrgs.name || ""}
                    onChange={(e) =>
                      setCurrentRndsOrgs({
                        ...currentRndsOrgs,
                        name: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">주소</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                    }}
                    type="text"
                    value={currentRndsOrgs?.address || ""}
                    onChange={(e) => {
                      setCurrentRndsOrgs({
                        ...currentRndsOrgs,
                        address: e.target.value,
                      });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-2">
                  <label className="block mb-1">번호</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                    }}
                    value={currentRndsOrgs?.phone}
                    type="text"
                    onChange={(e) =>
                      setCurrentRndsOrgs({
                        ...currentRndsOrgs,
                        phone: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">팩스</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                    }}
                    placeholder=""
                    type="text"
                    value={currentRndsOrgs?.fax || ""}
                    onChange={(e) => {
                      setCurrentRndsOrgs({
                        ...currentRndsOrgs,
                        fax: e.target.value,
                      });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-2">
                  <label className="block mb-1">이메일</label>
                  <motion.input
                    whileFocus={{
                      scale: 1.05, // 입력 시 약간 확대
                      boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                    }}
                    type="email"
                    value={currentRndsOrgs?.email}
                    onChange={(e) =>
                      setCurrentRndsOrgs({
                        ...currentRndsOrgs,
                        email: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <label className="block mb-1">담당자</label>
                  <button
                    className="px-3 py-1 bg-gray-200 text-xs md:text-sm rounded-md hover:bg-gray-300"
                    onClick={addContact}
                  >
                    + 추가
                  </button>
                </div>

                <div className="space-y-2">
                  {currentRndsOrgs.RnDs_contacts?.map((contact, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap md:flex-nowrap gap-2"
                    >
                      <motion.input
                        type="text"
                        placeholder="이름"
                        value={contact.name || ""}
                        onChange={(e) =>
                          handleContactChange(index, "name", e.target.value)
                        }
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        type="text"
                        placeholder="휴대폰"
                        value={contact.phone || ""}
                        onChange={(e) =>
                          handleContactChange(index, "phone", e.target.value)
                        }
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        type="text"
                        placeholder="부서"
                        value={contact.department || ""}
                        onChange={(e) =>
                          handleContactChange(
                            index,
                            "department",
                            e.target.value
                          )
                        }
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        type="text"
                        placeholder="직급"
                        value={contact.level || ""}
                        onChange={(e) =>
                          handleContactChange(index, "level", e.target.value)
                        }
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <motion.input
                        type="email"
                        placeholder="이메일"
                        value={contact.email || ""}
                        onChange={(e) =>
                          handleContactChange(index, "email", e.target.value)
                        }
                        className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                      />
                      <button
                        onClick={() => removeContact(index)}
                        className="px-4 py-2 bg-red-500 text-white text-xs md:text-sm rounded-md"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 비고 */}
              <div className="mb-2">
                <label className="block mb-1">비고</label>
                <textarea
                  placeholder=""
                  value={currentRndsOrgs?.notes || ""}
                  onChange={(e) =>
                    setCurrentRndsOrgs({
                      ...currentRndsOrgs,
                      notes: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md min-h-52"
                ></textarea>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={closeAddModal}
                  className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={handleAddOrgs}
                  className={`bg-blue-500 text-white px-4 py-2 rounded-md text-xs md:text-sm flex items-center ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={saving}
                >
                  저장
                  {saving && <CircularProgress size={18} className="ml-2" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center mt-4 overflow-x-auto space-x-1 md:space-x-2">
        <div className="flex justify-center mt-4 space-x-2">
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
      </div>
      {/* 스낵바 */}

      <SnackbarComponent
        onClose={() => setSnackbarMessage("")}
        message={snackbarMessage}
      />
    </div>
  );
}
