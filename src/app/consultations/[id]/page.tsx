"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Snackbar,
  Alert,
  Button,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { useLoginUser } from "@/app/context/login";

interface Consultation {
  id: string;
  date: string;
  content: string;
  follow_up_date: any;
  user_id: string;
  contact_name: string;
  // company_id: string;
  // priority: "low" | "medium" | "high"; // Enum 값
}
interface Contact {
  id: string;
  contact_name: string;
  mobile: string;
  department: string;
  level: string;
  email: string;
}

interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  fax: string;
  notes: string;
  business_number: string;
  contact: Contact[]; // 연락처 배열 추가
}

interface User {
  id: string;
  name: string;
}

export default function ConsultationPage() {
  const loginUser = useLoginUser();

  const router = useRouter();
  const { id } = useParams();
  const [saving, setSaving] = useState(false); // 🔹 저장 로딩 상태 추가

  const [consultations, setConsultations] = useState<Consultation[]>([]); // 여러 개의 상담 내역을 저장
  const [company, setCompany] = useState<Company | null>(null);
  const [documents, setDocuments] = useState<any[]>([]); // 문서 관련 데이터

  // const [loading, setLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false); // 🔹 회사 정보 로딩 상태
  const [consultationLoading, setConsultationLoading] = useState(false); // 🔹 상담 내역 로딩 상태

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [openAddModal, setOpenAddModal] = useState(false); // 상담내역 추가 모달 상태
  const [openEditModal, setOpenEditModal] = useState(false); // 상담내역 수정 모달 상태
  const [newConsultation, setNewConsultation] = useState({
    date: new Date().toISOString().split("T")[0],
    follow_up_date: "",
    contact_name: "",
    user_id: "", // 초기값 빈 문자열
    content: "",
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]); // 유저 목록
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
  const [totalPages, setTotalPages] = useState(1); // 전체 페이지 수
  const consultationsPerPage = 4; // 한 페이지에 보여줄 상담 내역 개수
  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null); // 선택된 상담 내역

  const [openDeleteModal, setOpenDeleteModal] = useState(false); // 삭제 모달 상태
  const [consultationToDelete, setConsultationToDelete] =
    useState<Consultation | null>(null); // 삭제할 상담 내역

  // 상담 내역을 가져오는 함수

  const fetchCompanyData = async () => {
    if (!id) return;
    setCompanyLoading(true);

    try {
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("id, contact_name, mobile, department, level, email")
        .eq("company_id", id);

      if (contactsError) {
        setSnackbarMessage("담당자를 불러오는 데 실패했습니다.");
        setOpenSnackbar(true);
      } else {
        setContacts(contactsData || []);
      }

      const { data: companyData, error: companyDataError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      setCompany({
        ...companyData,
        contact: contactsData || [],
      });

      if (companyDataError) {
        setSnackbarMessage("회사를 불러오는 데 실패했습니다.");
        setOpenSnackbar(true);
        return;
      }
    } catch (error) {
      console.error("❗ 회사정보 로딩 중 오류 발생:", error);
      setSnackbarMessage("회사정보를 가져오는 중 오류가 발생했습니다.");
      setOpenSnackbar(true);
    } finally {
      setCompanyLoading(false);
    }
  };

  const fetchConsultationData = async () => {
    if (!id) return;

    setConsultationLoading(true); // 상담 내역만 로딩 시작

    try {
      // 🔹 상담 내역 가져오기
      const {
        data: consultationsData,
        error: consultationsError,
        count,
      } = await supabase
        .from("consultations")
        .select("id, date, content, follow_up_date, user_id", {
          count: "exact",
        })
        .eq("company_id", id)
        .range(
          (currentPage - 1) * consultationsPerPage,
          currentPage * consultationsPerPage - 1
        )
        .order("created_at", { ascending: false });

      if (consultationsError) {
        setSnackbarMessage("상담 내역을 불러오는 데 실패했습니다.");
        setOpenSnackbar(true);
        setConsultationLoading(false);
        return;
      }

      console.log("🔹 가져온 상담 내역:", consultationsData);

      // 🔹 상담 ID 목록 가져오기
      const consultationIds = consultationsData.map((c) => c.id);

      // 🔹 상담과 담당자 매핑 정보 가져오기
      const {
        data: contactsConsultationsData,
        error: contactsConsultationsError,
      } = await supabase
        .from("contacts_consultations")
        .select("consultation_id, contact_id")
        .in("consultation_id", consultationIds);

      console.log("🔹 contacts_consultations 결과:", contactsConsultationsData);

      if (contactsConsultationsError || !contactsConsultationsData.length) {
        console.warn("❗ 상담과 담당자 연결 데이터가 없습니다.");
        setConsultationLoading(false);
        return;
      }

      // 🔹 contacts 테이블에서 담당자 정보 가져오기
      const contactIds = contactsConsultationsData.map((cc) => cc.contact_id);

      console.log("🔹 상담과 연결된 contact_id 목록:", contactIds);

      const { data: contactsInfo, error: contactsInfoError } = await supabase
        .from("contacts")
        .select("id, contact_name")
        .in("id", contactIds);

      console.log("🔹 contacts 테이블에서 가져온 담당자 목록:", contactsInfo);

      if (contactsInfoError || !contactsInfo.length) {
        console.warn("❗ contacts 테이블에서 담당자를 찾을 수 없습니다.");
        setConsultationLoading(false);
        return;
      }

      // 🔹 상담 ID 기준으로 담당자 이름 매핑
      const contactMap = contactsConsultationsData.reduce((acc, cc) => {
        const contact = contactsInfo.find((c) => c.id === cc.contact_id);
        if (contact) {
          acc[cc.consultation_id] = contact.contact_name;
        }
        return acc;
      }, {} as Record<string, string>);

      // 🔹 상담 내역에 담당자 이름 추가
      const updatedConsultations = consultationsData.map((c) => ({
        ...c,
        contact_name: contactMap[c.id] || "담당자 없음",
      }));

      console.log("🔹 최종 상담 내역:", updatedConsultations);

      setConsultations(updatedConsultations);
      setTotalPages(count ? Math.ceil(count / consultationsPerPage) : 1);
    } catch (error) {
      console.error("❗ 데이터 로딩 중 오류 발생:", error);
      setSnackbarMessage("데이터를 가져오는 중 오류가 발생했습니다.");
      setOpenSnackbar(true);
    } finally {
      setConsultationLoading(false);
    }
  };

  const fetchUsers = async () => {
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name");

    if (usersError) {
      setSnackbarMessage("유저 목록을 불러오는 데 실패했습니다.");
      setOpenSnackbar(true);
    } else {
      setUsers(usersData || []);
    }
  };

  useEffect(() => {
    if (contacts.length > 0) {
      setNewConsultation((prev) => ({
        ...prev,
        contact: contacts[0].contact_name, // 첫 번째 담당자로 기본값 설정
      }));
    }
  }, [contacts]);

  useEffect(() => {
    // ESC 키 핸들러
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenAddModal(false); // 추가 모달 닫기
        setOpenEditModal(false); // 수정 모달 닫기
        setOpenDeleteModal(false); // 삭제 모달 닫기
      }
    };

    fetchCompanyData();
    fetchUsers();

    window.addEventListener("keydown", handleKeyDown);

    // 언마운트 시 이벤트 제거
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (loginUser?.id) {
      setNewConsultation((prev) => ({
        ...prev,
        user_id: loginUser.id,
      }));
    }
  }, [loginUser]);

  useEffect(() => {
    fetchConsultationData();
  }, [currentPage]);

  const handleAddConsultation = async () => {
    if (saving) return;
    setSaving(true);

    const { content, follow_up_date, user_id, contact_name } = newConsultation;
    const formattedFollowUpDate = follow_up_date ? follow_up_date : null;

    if (!content || !user_id || !contact_name) {
      setSnackbarMessage("필수 항목을 모두 입력하세요.");
      setOpenSnackbar(true);
      setSaving(false);
      return;
    }

    try {
      // 🔹 Step 1: 상담 추가 후 ID 가져오기
      const { data: insertedConsultation, error: insertError } = await supabase
        .from("consultations")
        .insert([
          {
            date: new Date().toISOString().split("T")[0],
            company_id: id,
            content,
            follow_up_date: formattedFollowUpDate,
            user_id,
          },
        ])
        .select("id")
        .single();

      if (insertError || !insertedConsultation) {
        throw new Error("상담 내역 추가 실패");
      }

      const consultationId = insertedConsultation.id;

      // 🔹 Step 2: 담당자 ID 가져오기
      const selectedContact = contacts.find(
        (c) => c.contact_name === contact_name
      );
      if (!selectedContact) throw new Error("담당자 정보를 찾을 수 없습니다.");

      // 🔹 Step 3: 상담-담당자 연결 추가
      await supabase.from("contacts_consultations").insert([
        {
          contact_id: selectedContact.id,
          consultation_id: consultationId,
        },
      ]);

      setSnackbarMessage("상담 내역 추가 완료");
      setOpenSnackbar(true);
      setOpenAddModal(false);
      fetchConsultationData();
    } catch (error) {
      console.error("Error adding consultation:", error);
      setSnackbarMessage("상담 내역 추가 중 오류가 발생했습니다.");
      setOpenSnackbar(true);
    } finally {
      setSaving(false);
    }
  };

  // 수정 버튼을 누르면 모달에 기존 상담 내역을 불러오기
  const handleEditConsultation = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setNewConsultation({
      date: consultation.date,
      follow_up_date: consultation.follow_up_date,
      user_id: consultation.user_id,
      content: consultation.content,
      contact_name: consultation.contact_name,
    });
    setOpenEditModal(true);
  };

  const handleUpdateConsultation = async () => {
    if (saving) return; // 🔹 이미 저장 중이면 실행 안 함
    setSaving(true); // 🔥 저장 시작

    const { content, follow_up_date, user_id, contact_name } = newConsultation;

    if (!content || !user_id || !contact_name) {
      setSnackbarMessage("필수 항목을 모두 입력하세요.");
      setOpenSnackbar(true);
      setSaving(false);
      return;
    }

    try {
      const selectedContact = contacts.find(
        (c) => c.contact_name === contact_name
      );

      const { error } = await supabase
        .from("contacts_consultations")
        .update({
          contact_id: selectedContact?.id, // 🔥 선택된 새로운 담당자 ID
        })
        .eq("consultation_id", selectedConsultation?.id);

      if (error) {
        throw new Error("새로운 담당자 업데이트 실패");
      }

      // 🔹 Step 3: `consultations` 테이블을 업데이트 (새로운 `contact_id`로 변경)
      const { error: updateError } = await supabase
        .from("consultations")
        .update({
          content,
          follow_up_date,
          user_id,
        })
        .eq("id", selectedConsultation?.id);

      if (updateError) {
        throw new Error("상담 내역 수정 실패");
      }

      setSnackbarMessage("상담 내역 수정 완료");
      setOpenSnackbar(true);
      setOpenEditModal(false);

      // 🔹 상담 내역을 다시 불러옴
      fetchConsultationData();
    } catch (error) {
      console.error("Error updating consultation:", error);
      setSnackbarMessage("상담 내역 수정 중 오류가 발생했습니다.");
      setOpenSnackbar(true);
    } finally {
      setSaving(false);
    }
  };

  // 이전 페이지로 이동
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 다음 페이지로 이동
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 페이지 번호 클릭
  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  // 페이지네이션 번호 리스트 생성
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

  // company 관련 부분을 useMemo로 감싸 최적화
  const companyMemo = useMemo(() => company, [company]);

  const handleDeleteConsultation = async (consultation: Consultation) => {
    setConsultationToDelete(consultation);
    setOpenDeleteModal(true); // 삭제 모달 열기
  };

  const handleConfirmDelete = async () => {
    if (!consultationToDelete) return;

    try {
      const { error } = await supabase.from("deletion_requests").insert([
        {
          related_id: consultationToDelete.id,
          status: "pending", // 삭제 요청 대기 상태
          type: "consultation",
        },
      ]);

      console.log(error);

      if (error) {
        setSnackbarMessage("삭제 요청을 생성하는 데 실패했습니다.");
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage("삭제 요청이 생성되었습니다.");
        setOpenSnackbar(true);
        setOpenDeleteModal(false);
        fetchConsultationData(); // 상담 내역 새로고침
      }
    } catch (error) {
      setSnackbarMessage("삭제 요청 생성 중 오류가 발생했습니다.");
      setOpenSnackbar(true);
    }
  };

  const formatContentWithLineBreaks = (content: string) => {
    // 줄바꿈 문자를 <br /> 태그로 변환
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <div className="text-sm text-[#37352F]">
      <>
        <div className="mb-4">
          <Link
            href="/customers"
            className="text-blue-500 hover:underline hover:font-bold"
          >
            거래처 관리
          </Link>{" "}
          &gt; <span className="font-semibold">{companyMemo?.name}</span> &gt;
          상담내역
        </div>

        {/* 🚀 거래처 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 🏢 회사 정보 */}
          <div className="bg-[#FBFBFB] rounded-md border px-4 pt-3  h-40 flex flex-col justify-between">
            {companyLoading ? (
              <>
                <Skeleton variant="text" width="100%" height="100%" />
              </>
            ) : (
              <div>
                <h2 className="font-semibold text-md mb-1">거래처</h2>
                <ul className="space-y-1 text-gray-700 text-sm pl-1">
                  <li className="flex items-center">
                    <span className="font-medium w-14">회사명</span>
                    <span className="flex-1 truncate">{companyMemo?.name}</span>
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium w-14">주소</span>
                    <span className="flex-1 truncate">
                      {companyMemo?.address || "정보 없음"}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium w-14">전화</span>
                    <span className="flex-1">
                      {companyMemo?.phone || "정보 없음"}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium w-14">팩스</span>
                    <span className="flex-1">
                      {companyMemo?.fax || "정보 없음"}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium w-14">이메일</span>
                    <span className="flex-1 truncate">
                      {companyMemo?.email || "정보 없음"}
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* 📝 비고 */}
          <div className="bg-[#FBFBFB] rounded-md border px-4 pt-3 h-40 flex flex-col">
            {companyLoading ? (
              <>
                <Skeleton variant="text" width="100%" height="100%" />
              </>
            ) : (
              <>
                <h2 className="font-semibold text-md mb-1">담당자</h2>

                <div className=" h-28 overflow-y-auto">
                  <table className="w-full text-xs border-collapse">
                    {/* 🔹 테이블 헤더 고정 (sticky top-0 적용) */}
                    <thead className="border-b font-semibold bg-gray-100 sticky top-0">
                      {/* <tr>
                      <th className="text-left px-2 py-1">이름</th>
                      <th className="text-left px-2 py-1">직급</th>
                      <th className="text-left px-2 py-1">부서</th>
                      <th className="text-left px-2 py-1">이메일</th>
                    </tr> */}
                    </thead>
                    {/* 🔹 내용만 스크롤 */}
                    <tbody className="text-sm">
                      {company?.contact.map((contact, index) => (
                        <tr
                          key={index}
                          className={`${
                            index !== company.contact.length - 1
                              ? "border-b"
                              : ""
                          }`}
                        >
                          <td className="px-1 py-1">{contact.contact_name}</td>
                          <td className="px-1 py-1">{contact.level}</td>
                          <td className="px-1 py-1">{contact.department}</td>
                          <td className="px-1 py-1">{contact.mobile}</td>
                          <td className="px-1 py-1 truncate">
                            {contact.email}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="bg-[#FBFBFB] rounded-md border pl-4 pt-3">
            {companyLoading ? (
              <Skeleton variant="rectangular" width="100%" height="100%" />
            ) : (
              <>
                <h2 className="font-semibold text-md mb-1">비고</h2>
                <div className="text-sm min-h-[80px] max-h-28 overflow-y-auto pl-1">
                  <span>{companyMemo?.notes || "내용 없음"}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 🚀 추가 버튼 */}

        <div className="flex my-3">
          <div
            className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
            onClick={() => setOpenAddModal(true)}
          >
            <span className="mr-2">+</span>
            <span>추가</span>
          </div>
        </div>

        {/* 상담 내역 추가 모달 */}
        {openAddModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-md w-1/2 ">
              <h3 className="text-xl font-semibold mb-4">상담 내역 추가</h3>

              {/* 상담일 및 후속 날짜 (flex로 배치) */}
              <div className="mb-4 grid space-x-4 grid-cols-4">
                <div className="">
                  <label className="block mb-2 text-sm font-medium">
                    상담일
                  </label>
                  <input
                    type="date"
                    value={newConsultation.date}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    후속 날짜
                  </label>
                  <input
                    type="date"
                    value={newConsultation.follow_up_date}
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        follow_up_date: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    피상담자
                  </label>
                  <select
                    defaultValue={newConsultation.contact_name}
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        contact_name: e.target.value, // 선택된 담당자의 이름 저장
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">담당자 선택</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.contact_name}>
                        {contact.contact_name} ({contact.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    상담자
                  </label>
                  <select
                    value={newConsultation.user_id} // 로그인한 유저를 기본값으로 설정
                    disabled
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        user_id: e.target.value, // 유저가 선택한 값으로 설정
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    {/* 다른 유저들 */}
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 상담 내용 */}
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">
                  상담 내용
                </label>
                <textarea
                  value={newConsultation.content}
                  onChange={(e) =>
                    setNewConsultation({
                      ...newConsultation,
                      content: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={4}
                />
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setOpenAddModal(false);
                    setNewConsultation({
                      date: new Date().toISOString().split("T")[0],
                      follow_up_date: "",
                      user_id: loginUser ? loginUser.id : "",
                      content: "",
                      contact_name: "",
                    });
                  }}
                  className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={saving}
                >
                  취소
                </button>

                <button
                  onClick={handleAddConsultation}
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
          </div>
        )}

        {/* 상담 내역 수정 모달 */}
        {openEditModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-md w-1/2">
              <h3 className="text-xl font-semibold mb-4">상담 내역 수정</h3>

              {/* 상담일 및 후속 날짜 (flex로 배치) */}
              <div className="mb-4 grid grid-cols-4 space-x-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    상담일
                  </label>
                  <input
                    type="date"
                    value={newConsultation.date}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    후속 날짜
                  </label>
                  <input
                    type="date"
                    value={
                      newConsultation.follow_up_date
                        ? newConsultation.follow_up_date
                        : ""
                    }
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        follow_up_date: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    피상담자
                  </label>
                  <select
                    defaultValue={newConsultation.contact_name}
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        contact_name: e.target.value, // 선택된 담당자의 이름 저장
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">담당자 선택</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.contact_name}>
                        {contact.contact_name} ({contact.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    상담자
                  </label>

                  <select
                    value={newConsultation.user_id}
                    disabled
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        user_id: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 상담 내용 */}
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium">
                  상담 내용
                </label>
                <textarea
                  value={newConsultation.content}
                  onChange={(e) =>
                    setNewConsultation({
                      ...newConsultation,
                      content: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={4}
                />
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setOpenEditModal(false);
                    setNewConsultation({
                      date: new Date().toISOString().split("T")[0], // 초기화
                      follow_up_date: "",
                      user_id: "",
                      content: "",
                      contact_name: "",
                    });
                  }}
                  className={`bg-gray-500 text-white px-4 py-2 rounded-md text-xs md:text-sm ${
                    saving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={saving}
                >
                  취소
                </button>

                <button
                  onClick={handleUpdateConsultation}
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
          </div>
        )}

        {/* 상담 내역 테이블 */}
        <div className="bg-[#FBFBFB] rounded-md border">
          {consultations.length > 0 && (
            <table className="min-w-full table-auto border-collapse text-center">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    No.
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    날짜
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                    피상담자
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                    상담자
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-5/12">
                    내용
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    체크
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    문서
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    수정
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    삭제
                  </th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((consultation, index) => (
                  <tr key={consultation.id} className="hover:bg-gray-100">
                    <td className="px-4 py-2 border-b border-r-[1px]">
                      {consultation.id.slice(0, 4)}
                    </td>
                    <td className="px-4 py-2 border-b border-r-[1px]">
                      {consultation.date}
                    </td>
                    <td className="px-4 py-2 border-b border-r-[1px]">
                      {consultation.contact_name}
                    </td>
                    <td className="px-4 py-2 border-b border-r-[1px]">
                      {
                        users.find((user) => user.id === consultation.user_id)
                          ?.name
                      }
                    </td>
                    <td
                      className="px-4 py-2 border-b border-r-[1px] w-full text-start"
                      style={{
                        minHeight: "120px",
                        maxHeight: "120px",
                        overflowY: "auto",
                        display: "block",
                      }}
                    >
                      {formatContentWithLineBreaks(consultation.content)}
                    </td>
                    <td className="px-4 py-2 border-b border-r-[1px]">
                      {consultation.follow_up_date}
                    </td>
                    <td className="px-4 py-2 border-b border-r-[1px]">
                      <span
                        className={`mr-2 cursor-pointer ${
                          documents.some(
                            (doc) =>
                              doc.type === "estimate" &&
                              doc.consultation_id === consultation.id
                          )
                            ? "text-blue-500 hover:font-bold"
                            : "text-gray-400 hover:text-black"
                        }`}
                        onClick={() =>
                          router.push(
                            `/documents/estimate?consultId=${consultation.id}&compId=${company?.id}`
                          )
                        }
                      >
                        견적서
                      </span>
                      <span
                        className={`mr-2 cursor-pointer ${
                          documents.some(
                            (doc) =>
                              doc.type === "order" &&
                              doc.consultation_id === consultation.id
                          )
                            ? "text-blue-500 hover:font-bold"
                            : "text-gray-400 hover:text-black"
                        }`}
                        onClick={() =>
                          router.push(
                            `/documents/order?consultId=${consultation.id}&compId=${company?.id}`
                          )
                        }
                      >
                        발주서
                      </span>
                      <span
                        className={`mr-2 cursor-pointer ${
                          documents.some(
                            (doc) =>
                              doc.type === "requestQuote" &&
                              doc.consultation_id === consultation.id
                          )
                            ? "text-blue-500 hover:font-bold"
                            : "text-gray-400 hover:text-black"
                        }`}
                        onClick={() =>
                          router.push(
                            `/documents/requestQuote?consultId=${consultation.id}&compId=${company?.id}`
                          )
                        }
                      >
                        의뢰서
                      </span>
                    </td>
                    <td
                      className={`px-4 py-2 border-b border-r-[1px] ${
                        loginUser?.id === consultation.user_id &&
                        "text-blue-500 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (loginUser?.id === consultation.user_id)
                          handleEditConsultation(consultation);
                      }}
                    >
                      수정
                    </td>
                    <td
                      className={`px-4 py-2 border-b border-r-[1px] ${
                        loginUser?.id === consultation.user_id &&
                        "text-red-500 cursor-pointer"
                      }`}
                      onClick={() => {
                        if (loginUser?.id === consultation.user_id)
                          handleDeleteConsultation(consultation);
                      }}
                    >
                      삭제
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 페이지네이션 */}
        <div className="flex justify-center mt-4 space-x-2">
          <Button onClick={prevPage} disabled={currentPage === 1}>
            이전
          </Button>

          {/* 페이지 번호 */}
          {paginationNumbers().map((page, index) => (
            <Button
              key={index}
              onClick={() => handlePageClick(Number(page))}
              className={`text-sm ${page === currentPage ? "font-bold" : ""}`}
            >
              {page}
            </Button>
          ))}

          <Button onClick={nextPage} disabled={currentPage === totalPages}>
            다음
          </Button>
        </div>
      </>

      {openDeleteModal && consultationToDelete && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md w-1/3 max-w-lg">
            <h3 className="text-xl font-semibold mb-4">상담 내역 삭제</h3>
            <p>
              정말로 "{consultationToDelete.content}"의 상담 내역을
              삭제하시겠습니까?
            </p>

            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setOpenDeleteModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm"
              >
                삭제
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
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert severity="error">{snackbarMessage}</Alert>
      </Snackbar>
    </div>
  );
}
