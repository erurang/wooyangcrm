"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  contact_level: string;
  documents: {
    estimate: boolean;
    order: boolean;
    requestQuote: boolean;
  };
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
}

interface User {
  id: string;
  name: string;
  level: string;
}

export default function ConsultationPage() {
  const loginUser = useLoginUser();

  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();

  const [saving, setSaving] = useState(false);

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [company, setCompany] = useState<Company | null>(null);

  const [companyLoading, setCompanyLoading] = useState(false);
  const [consultationLoading, setConsultationLoading] = useState(false);

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [newConsultation, setNewConsultation] = useState({
    date: new Date().toISOString().split("T")[0],
    follow_up_date: "",
    contact_name: "",
    user_id: "",
    content: "",
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const consultationsPerPage = 4;
  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [consultationToDelete, setConsultationToDelete] =
    useState<Consultation | null>(null);

  function transformConsultationData(
    consultations: any[],
    contacts: Contact[],
    contacts_consultations: { contact_id: string; consultation_id: string }[]
  ) {
    return consultations.map((consultation) => {
      const contactRelation = contacts_consultations.find(
        (cc) => cc.consultation_id === consultation.id
      );

      const firstContact =
        contacts.find(
          (contact) => contact.id === contactRelation?.contact_id
        ) || ({} as Partial<Contact>);

      const documentTypes = {
        estimate: false,
        order: false,
        requestQuote: false,
      };

      consultation.documents.forEach((doc: any) => {
        if (doc.type === "estimate") documentTypes.estimate = true;
        if (doc.type === "order") documentTypes.order = true;
        if (doc.type === "requestQuote") documentTypes.requestQuote = true;
      });

      return {
        content: consultation.content,
        date: consultation.date,
        contact_name: firstContact.contact_name || "",
        contact_level: firstContact.level || "",
        contact_email: firstContact.email || "",
        contact_mobile: firstContact.mobile || "",
        documents: documentTypes,
        follow_up_date: consultation.follow_up_date,
        id: consultation.id,
        user_id: consultation.user_id,
      };
    });
  }

  const fetchContactsData = async () => {
    if (!id) return;

    try {
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select("id, contact_name, mobile, department, level, email")
        .eq("company_id", id);

      if (contactsError) {
        setSnackbarMessage("담당자를 불러오는 데 실패했습니다.");
        setOpenSnackbar(true);
      }
      setContacts(contactsData || []);
    } catch (error) {
      console.error("담당자 로딩 중 오류 발생:", error);
      setSnackbarMessage(
        "담당자 가져오는 중 오류가 발생했습니다.-fetchContactsData"
      );
      setOpenSnackbar(true);
    }
  };

  const fetchCompanyData = async () => {
    if (!id) return;
    setCompanyLoading(true);

    try {
      const { data: companyData, error: companyDataError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single();

      setCompany(companyData);

      if (companyDataError) {
        setSnackbarMessage("회사를 불러오는 데 실패했습니다.");
        setOpenSnackbar(true);
        return;
      }
    } catch (error) {
      console.error("❗ 회사정보 로딩 중 오류 발생:", error);
      setSnackbarMessage(
        "회사정보를 가져오는 중 오류가 발생했습니다.-fetchCompanyData"
      );
      setOpenSnackbar(true);
    } finally {
      setCompanyLoading(false);
    }
  };

  const fetchConsultationData = async () => {
    if (!id) return;

    setConsultationLoading(true);

    try {
      const {
        data: consultationsData,
        error: consultationsError,
        count,
      } = await supabase
        .from("consultations")
        .select(
          `id, date, content, follow_up_date, user_id,
          documents (type)
        `,
          {
            count: "exact",
          }
        )
        .eq("company_id", id)
        .range(
          (currentPage - 1) * consultationsPerPage,
          currentPage * consultationsPerPage - 1
        )
        .order("created_at", { ascending: false });

      if (consultationsError) {
        setSnackbarMessage("상담 내역을 불러오는 데 실패했습니다.");
        setOpenSnackbar(true);
        return;
      }

      const filteredConsultId = consultationsData.map((con) => con.id);

      const {
        data: contactsConsultationData,
        error: contactsConsultationDataError,
      } = await supabase
        .from("contacts_consultations")
        .select("consultation_id, contact_id")
        .in("consultation_id", filteredConsultId);

      if (consultationsError) {
        setSnackbarMessage("문서-담당자 관계를 불러오는 데 실패했습니다.");
        setOpenSnackbar(true);
        return;
      }

      setConsultations(
        transformConsultationData(
          consultationsData,
          contacts,
          contactsConsultationData ?? []
        )
      );

      setTotalPages(count ? Math.ceil(count / consultationsPerPage) : 1);
    } catch (error) {
      console.error("fetchConsultationData 데이터 로딩 중 오류 발생:", error);
      setOpenSnackbar(true);
      setSnackbarMessage(
        "데이터를 가져오는 중 오류가 발생했습니다.-fetchConsultationData"
      );
    } finally {
      setConsultationLoading(false);
    }
  };

  console.log("consultations,", consultations);

  const fetchUsers = async () => {
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name,level");

    if (usersError) {
      setSnackbarMessage("유저 목록을 불러오는 데 실패했습니다.");
      setOpenSnackbar(true);
    } else {
      setUsers(usersData || []);
    }
  };

  useEffect(() => {
    // 🔹 URL에서 page 값을 읽어서 상태 업데이트
    const pageParam = searchParams.get("page");
    if (pageParam) {
      setCurrentPage(Number(pageParam));
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCompanyData();
    fetchUsers();
    fetchContactsData();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenAddModal(false);
        setOpenEditModal(false);
        setOpenDeleteModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (contacts.length !== 0) fetchConsultationData();
  }, [contacts, currentPage]);

  useEffect(() => {
    if (contacts.length > 0) {
      setNewConsultation((prev) => ({
        ...prev,
        contact_name: contacts[0].contact_name,
      }));
    }

    if (loginUser?.id) {
      setNewConsultation((prev) => ({
        ...prev,
        user_id: loginUser.id,
      }));
    }
  }, [contacts, loginUser]);

  const handleAddConsultation = async () => {
    if (saving) return;
    setSaving(true);

    const { content, follow_up_date, user_id, contact_name } = newConsultation;
    const formattedFollowUpDate = follow_up_date ? follow_up_date : null;

    if (!content) {
      setSnackbarMessage("상담 내용을 입력하세요.");
      setOpenSnackbar(true);
      setSaving(false);
      return;
    }

    if (!contact_name) {
      setSnackbarMessage("담당자를 선택해주세요.");
      setOpenSnackbar(true);
      setSaving(false);
      return;
    }

    try {
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

      const selectedContact = contacts.find(
        (c) => c.contact_name === contact_name
      );

      if (!selectedContact) throw new Error("담당자 정보를 찾을 수 없습니다.");

      await supabase.from("contacts_consultations").insert([
        {
          contact_id: selectedContact.id,
          consultation_id: consultationId,
          user_id: user_id,
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
    if (saving) return;
    setSaving(true);

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
          contact_id: selectedContact?.id,
          // user_id 만약 상담자 변경 기능을 만들어야한다면
        })
        .eq("consultation_id", selectedConsultation?.id);

      if (error) {
        throw new Error("새로운 담당자 업데이트 실패");
      }

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

      fetchConsultationData();
    } catch (error) {
      console.error("Error updating consultation:", error);
      setSnackbarMessage("상담 내역 수정 중 오류가 발생했습니다.");
      setOpenSnackbar(true);
    } finally {
      setSaving(false);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    router.push(`/consultations/${id}?page=${page}`, { scroll: false });
  };

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

  const companyMemo = useMemo(() => company, [company]);

  const handleDeleteConsultation = async (consultation: Consultation) => {
    setConsultationToDelete(consultation);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!consultationToDelete) return;

    try {
      const { error } = await supabase.from("deletion_requests").insert([
        {
          related_id: consultationToDelete.id,
          status: "pending",
          type: "consultation",
        },
      ]);

      if (error) {
        setSnackbarMessage("삭제 요청을 생성하는 데 실패했습니다.");
        setOpenSnackbar(true);
      } else {
        setSnackbarMessage("삭제 요청이 생성되었습니다.");
        setOpenSnackbar(true);
        setOpenDeleteModal(false);
        fetchConsultationData();
      }
    } catch (error) {
      setSnackbarMessage("삭제 요청 생성 중 오류가 발생했습니다.");
      setOpenSnackbar(true);
    }
  };

  const formatContentWithLineBreaks = (content: string) => {
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
                    <thead className="border-b font-semibold bg-gray-100 sticky top-0"></thead>
                    <tbody className="text-sm">
                      {contacts?.map((contact, index) => (
                        <tr
                          key={index}
                          className={`${
                            index !== contacts.length - 1 ? "border-b" : ""
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
                    고객명
                  </label>
                  <select
                    defaultValue={newConsultation.contact_name}
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        contact_name: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">담당자 선택</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.contact_name}>
                        {contact.contact_name} ({contact.level})
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
                    {/* 다른 유저들 */}
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} {user.level}
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
                        contact_name: e.target.value,
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
                        {user.name} {user.level}
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
                      date: new Date().toISOString().split("T")[0],
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
                  <tr
                    key={consultation.id}
                    className="hover:bg-gray-100 border-b"
                  >
                    <td className="px-4 py-2 border-r-[1px]">
                      {consultation.id.slice(0, 4)}
                    </td>
                    <td className="px-4 py-2 border-r-[1px]">
                      {consultation.date}
                    </td>
                    <td className="px-4 py-2 border-r-[1px]">
                      {consultation.contact_name} {consultation.contact_level}
                    </td>
                    <td className="px-4 py-2 border-r-[1px]">
                      {
                        users.find((user) => user.id === consultation.user_id)
                          ?.name
                      }{" "}
                      {
                        users.find((user) => user.id === consultation.user_id)
                          ?.level
                      }
                    </td>
                    <td
                      className="px-4 py-2 border-r-[1px] w-full text-start"
                      style={{
                        minHeight: "120px",
                        maxHeight: "120px",
                        overflowY: "auto",
                        display: "block",
                      }}
                    >
                      {formatContentWithLineBreaks(consultation.content)}
                    </td>
                    <td className="px-4 py-2 border-r-[1px]">
                      {consultation.follow_up_date}
                    </td>
                    <td className="px-4 py-2 border-r-[1px]">
                      <span
                        className={`mr-2 cursor-pointer ${
                          consultation.documents.estimate
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
                          consultation.documents.order
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
                          consultation.documents.requestQuote
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
                      className={`px-4 py-2 border-r-[1px] ${
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
                      className={`px-4 py-2 border-r-[1px] ${
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
        <div className="flex justify-center mt-4 overflow-x-auto space-x-1 md:space-x-2">
          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-200"
            >
              이전
            </button>

            {paginationNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => handlePageClick(Number(page))}
                className={`px-4 py-2 rounded ${
                  page === currentPage
                    ? "bg-blue-500 text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-200"
            >
              다음
            </button>
          </div>
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
