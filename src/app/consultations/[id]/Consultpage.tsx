"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton, CircularProgress } from "@mui/material";
import { useLoginUser } from "@/context/login";
import SnackbarComponent from "@/components/Snackbar";

import { useFavorites } from "@/hooks/favorites/useFavorites";
import { useConsultationsList } from "@/hooks/consultations/useConsultationsList";
import { useCompanyDetails } from "@/hooks/consultations/useCompanyDetails";
import { useContactsByCompany } from "@/hooks/manage/customers/useContactsByCompany";
import { useConsultationContacts } from "@/hooks/consultations/useConsultationContacts";
import { useUsersList } from "@/hooks/useUserList";
import { useAddConsultation } from "@/hooks/consultations/useAddConsultation";
import { useAssignConsultationContact } from "@/hooks/consultations/useAssignConsultationContact";
import { useUpdateConsultation } from "@/hooks/consultations/useUpdateConsultation";
import FileUpload from "@/components/consultations/FileUpload";
import { useUpdateContacts } from "@/hooks/manage/customers/useUpdateContacts";

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
  resign: boolean;
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
  const { id } = useParams();
  const router = useRouter();
  const loginUser = useLoginUser();
  const searchParams = useSearchParams();

  const [saving, setSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const [deleteReason, setDeleteReason] = useState("");
  const [newConsultation, setNewConsultation] = useState({
    date: new Date().toISOString().split("T")[0],
    follow_up_date: "",
    contact_name: "",
    user_id: "",
    content: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null);

  const [openEditNotesModal, setOpenEditNotesModal] = useState(false);
  const [openEditContactsModal, setOpenEditContactsModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [consultationToDelete, setConsultationToDelete] =
    useState<Consultation | null>(null);

  /// swr ///////
  const { users } = useUsersList();

  const { favorites, removeFavorite, refetchFavorites, addFavorite } =
    useFavorites(loginUser?.id);
  const { consultations, totalPages, refreshConsultations } =
    useConsultationsList(id as string, currentPage);

  const {
    companyDetail,
    isLoading: isCompanyDetailLoading,
    refreshCompany,
  } = useCompanyDetails(id as any);

  const { contacts, refreshContacts } = useContactsByCompany([id] as any);

  const consultationIds = consultations?.map((con: any) => con.id) || [];
  const { contactsConsultations, refreshContactsConsultations } =
    useConsultationContacts(consultationIds);

  const { addConsultation, isAdding } = useAddConsultation();
  const { assignConsultationContact } = useAssignConsultationContact();

  const { updateConsultation, isUpdating } = useUpdateConsultation();

  //// swr ////////

  const [notes, setNotes] = useState(companyDetail?.notes || "");

  const handleUpdateNotes = async () => {
    if (!companyDetail?.id) return;

    try {
      const { error } = await supabase
        .from("companies")
        .update({ notes })
        .eq("id", companyDetail.id);

      await refreshCompany();

      if (error) {
        setSnackbarMessage("비고 수정 실패");
      } else {
        setSnackbarMessage("비고 수정 완료");
        setOpenEditNotesModal(false);
      }
    } catch (error) {
      setSnackbarMessage("비고 수정 중 오류 발생");
    }
  };

  const processedConsultations = useMemo(() => {
    return consultations?.map((consultation: any) => {
      // 🔹 상담 ID에 해당하는 연락처 정보 찾기
      const contactRelation = contactsConsultations.find(
        (cc: any) => cc.consultation_id === consultation.id
      );

      // 🔹 `Partial<Contact>`로 빈 객체의 타입 지정
      const firstContact: any = contactRelation?.contacts || {};

      // 🔹 문서 변환 로직
      const documentTypes = {
        estimate: false,
        order: false,
        requestQuote: false,
      };

      consultation.documents?.forEach((doc: { type: string }) => {
        if (doc.type === "estimate") documentTypes.estimate = true;
        if (doc.type === "order") documentTypes.order = true;
        if (doc.type === "requestQuote") documentTypes.requestQuote = true;
      });

      return {
        ...consultation,
        contact_name: firstContact.contact_name || "",
        contact_level: firstContact.level || "",
        contact_email: firstContact.email || "",
        contact_mobile: firstContact.mobile || "",
        documents: documentTypes, // 🔹 변환된 documents 적용
      };
    });
  }, [consultations, contactsConsultations]);

  const handleAddConsultation = async () => {
    if (isAdding) return;

    const { content, follow_up_date, user_id, contact_name } = newConsultation;

    if (!content) {
      setSnackbarMessage("상담 내용을 입력하세요.");
      return;
    }

    if (!contact_name) {
      setSnackbarMessage("담당자를 선택해주세요.");
      return;
    }

    const formattedFollowUpDate = follow_up_date ? follow_up_date : null;

    try {
      setSaving(true);

      const addedConsultation = await addConsultation({
        method: "POST",
        body: {
          date: new Date().toISOString().split("T")[0],
          company_id: id as string,
          content,
          follow_up_date: formattedFollowUpDate,
          user_id,
        },
      });

      if (!addedConsultation?.consultation_id) {
        throw new Error("상담 추가 실패");
      }

      // 🔹 담당자 찾기
      const selectedContact = contacts.find(
        (c: Contact) => c.contact_name === contact_name
      );

      if (!selectedContact) {
        throw new Error("담당자 정보를 찾을 수 없습니다.");
      }

      // 🔹 상담-담당자 연결
      await assignConsultationContact({
        method: "POST",
        body: {
          consultation_id: addedConsultation.consultation_id,
          contact_id: selectedContact.id,
          user_id,
        },
      });

      setSnackbarMessage("상담 내역 추가 완료");
      setOpenAddModal(false);
      await refreshConsultations();
      await refreshContactsConsultations();
    } catch (error) {
      setSnackbarMessage("상담 내역 추가 중 오류 발생");
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
    if (isUpdating) return;

    const { content, follow_up_date, user_id, contact_name } = newConsultation;

    if (!content || !user_id || !contact_name) {
      setSnackbarMessage("필수 항목을 모두 입력하세요.");
      return;
    }

    const selectedContact = contacts.find(
      (c: Contact) => c.contact_name === contact_name
    );

    if (!selectedContact) {
      setSnackbarMessage("담당자를 찾을 수 없습니다.");
      return;
    }

    try {
      setSaving(true);

      // ✅ SWR Mutation 호출
      await updateConsultation({
        method: "PATCH",
        body: {
          consultation_id: selectedConsultation?.id,
          content,
          follow_up_date,
          user_id,
          contact_id: selectedContact.id,
        },
      });

      setSnackbarMessage("상담 내역 수정 완료");
      setOpenEditModal(false);
      await refreshConsultations();
      await refreshContactsConsultations();
    } catch (error) {
      setSnackbarMessage("상담 내역 수정 중 오류 발생");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConsultation = async (consultation: Consultation) => {
    setConsultationToDelete(consultation);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!consultationToDelete) return;
    if (deleteReason.length === 0) return;

    try {
      const { error } = await supabase.from("deletion_requests").insert([
        {
          related_id: consultationToDelete.id,
          status: "pending",
          type: "consultations",
          request_date: new Date(),
          user_id: loginUser?.id || "",
          delete_reason: deleteReason,
          content: {
            consultations: `상담삭제 : ${consultationToDelete?.contact_name} ${consultationToDelete?.contact_level} ${consultationToDelete?.content}`,
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

  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  const handleAddFavorite = async () => {
    try {
      await addFavorite(loginUser?.id, id, companyDetail?.name);
      await refetchFavorites();

      setSnackbarMessage("즐겨찾기에 추가되었습니다.");
    } catch (error) {
      console.error("Error fetching performance data:", error);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      await removeFavorite(id);
      await refetchFavorites();
      setSnackbarMessage("즐겨찾기가 삭제되었습니다.");
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  useEffect(() => {
    // 🔹 첫 번째 담당자를 찾고, 없으면 유지
    const defaultContactName =
      contacts.length > 0
        ? contacts[0].contact_name
        : newConsultation.contact_name;
    const defaultUserId = loginUser?.id ?? newConsultation.user_id;

    // 🔹 상태 변경이 필요할 때만 실행
    if (
      newConsultation.contact_name !== defaultContactName ||
      newConsultation.user_id !== defaultUserId
    ) {
      setNewConsultation((prev) => ({
        ...prev,
        contact_name: defaultContactName,
        user_id: defaultUserId,
      }));
    }
  }, [contacts, loginUser]);

  useEffect(() => {
    // 🔹 URL에서 page 값을 읽어서 상태 업데이트
    const pageParam = searchParams.get("page");
    if (pageParam) {
      setCurrentPage(Number(pageParam));
    }
  }, [searchParams]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenAddModal(false);
        setOpenEditModal(false);
        setOpenDeleteModal(false);
        setOpenEditNotesModal(false);
        setOpenEditContactsModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const [contactsUi, setContactsUi] = useState<any>(contacts ?? []);
  const { updateContacts } = useUpdateContacts();

  useEffect(() => {
    if (contacts && JSON.stringify(contactsUi) !== JSON.stringify(contacts)) {
      setContactsUi(contacts);
    }
  }, [contacts]);

  const addContact = () => {
    setContactsUi((prev: any) => [
      {
        contact_name: "",
        mobile: "",
        department: "",
        level: "",
        email: "",
        resign: false,
      },
      ...prev,
    ]);
  };

  const handleUpdateContacts = async () => {
    setSaving(true);

    try {
      await updateContacts(contactsUi, contacts[0].company_id);
      await refreshContacts();
      await refreshContactsConsultations();
      setSnackbarMessage("거래처 수정 완료");
      setOpenEditContactsModal(false);
    } catch (error) {
      console.error("Error updating company:", error);
      setSnackbarMessage("거래처 수정 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleContactChange = (
    index: number,
    field: keyof Contact,
    value: any
  ) => {
    setContactsUi((prev: any) => {
      const updatedContact = [...prev];
      updatedContact[index] = { ...updatedContact[index], [field]: value };
      return updatedContact;
    });
  };

  const removeContact = (index: number) => {
    const updatedContact = [...contactsUi];

    updatedContact.splice(index, 1);
    setContactsUi(updatedContact);
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
          &gt; <span className="font-semibold">{companyDetail?.name}</span> &gt;
          상담내역
        </div>

        {/* 🚀 거래처 기본 정보 */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#FBFBFB] rounded-md border px-4 pt-3  h-48 flex flex-col justify-between">
            {isCompanyDetailLoading ? (
              <>
                <Skeleton variant="text" width="100%" height="100%" />
              </>
            ) : (
              <div>
                <h2 className="font-semibold text-md mb-1">거래처</h2>
                <ul className="space-y-1 text-gray-700 text-sm pl-1">
                  <li className="flex items-center">
                    <span className="font-medium w-14">회사명</span>
                    <span className="flex-1 truncate">
                      {companyDetail?.name}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium w-14">주소</span>
                    <span className="flex-1 truncate">
                      {companyDetail?.address ||
                        "거래처검색 -> 수정 정보를 입력해주세요."}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium w-14">배송</span>
                    <span className="flex-1 truncate">
                      {companyDetail?.parcel ||
                        "거래처검색 -> 수정 정보를 입력해주세요."}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium w-14">전화</span>
                    <span className="flex-1">
                      {companyDetail?.phone ||
                        "거래처검색 -> 수정 정보를 입력해주세요."}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium w-14">팩스</span>
                    <span className="flex-1">
                      {companyDetail?.fax ||
                        "거래처검색 -> 수정 정보를 입력해주세요."}
                    </span>
                  </li>
                  <li className="flex items-center">
                    <span className="font-medium w-14">이메일</span>
                    <span className="flex-1 truncate">
                      {companyDetail?.email ||
                        "거래처검색 -> 수정 정보를 입력해주세요."}
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="bg-[#FBFBFB] rounded-md border px-4 pt-3 h-48 flex flex-col">
            {isCompanyDetailLoading ? (
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
                      {contacts?.map((contact: any, index: any) => {
                        if (!contact.resign)
                          return (
                            <tr
                              key={index}
                              className={`${
                                index !== contacts.length - 1 ? "border-b" : ""
                              }`}
                            >
                              <td
                                className="px-1 py-1 text-blue-500 cursor-pointer hover:font-semibold"
                                onClick={() =>
                                  router.push(`/manage/contacts/${contact.id}`)
                                }
                              >
                                {contact.contact_name}
                              </td>
                              <td className="px-1 py-1">{contact.level}</td>
                              <td className="px-1 py-1">
                                {contact.department}
                              </td>
                              <td className="px-1 py-1">{contact.mobile}</td>
                              <td className="px-1 py-1 truncate">
                                {contact.email}
                              </td>
                            </tr>
                          );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="bg-[#FBFBFB] rounded-md border pl-4 pt-3">
            {isCompanyDetailLoading ? (
              <Skeleton variant="rectangular" width="100%" height="100%" />
            ) : (
              <>
                <h2 className="font-semibold text-md mb-1">비고</h2>
                <div className="text-sm min-h-[80px] max-h-28 overflow-y-auto px-1">
                  <span>
                    {companyDetail?.notes ||
                      "비고 추가/수정을 사용하여 해당 거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요."}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 🚀 추가 버튼 */}

        <div className="flex my-4 gap-4">
          {favorites.find((fav: any) => fav.name === companyDetail?.name) ? (
            <div
              className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
              onClick={() => {
                if (companyDetail?.id) {
                  handleRemoveFavorite(companyDetail.id);
                }
              }}
            >
              <span className="mr-2">-</span>
              <span>즐겨찾기 삭제</span>
            </div>
          ) : (
            <div
              className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
              onClick={() => handleAddFavorite()}
            >
              <span className="mr-2">+</span>
              <span>즐겨찾기 추가</span>
            </div>
          )}
          <div
            className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
            onClick={() => setOpenAddModal(true)}
          >
            <span className="mr-2">+</span>
            <span>상담 추가</span>
          </div>
          <div
            className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
            onClick={() => setOpenEditContactsModal(true)}
          >
            <span className="mr-2">+</span>
            <span>담당자 추가/수정</span>
          </div>
          <div
            className="px-4 py-2 font-semibold cursor-pointer hover:bg-opacity-10 hover:bg-black hover:rounded-md"
            onClick={() => setOpenEditNotesModal(true)}
          >
            <span className="mr-2">+</span>
            <span>비고 추가/수정</span>
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
                {/* <div>
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
                </div> */}
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    담당자명
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
                    {contacts.map((contact: any) => {
                      if (!contact.resign)
                        return (
                          <option key={contact.id} value={contact.contact_name}>
                            {contact.contact_name} ({contact.level})
                          </option>
                        );
                    })}
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
                    {users.map((user: any) => (
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
                  placeholder="담당자를 선택후 상담을 작성해주세요. 담당자가 없으면 상담이 추가되지 않습니다. 담당자가 없다면 담당자를 추가후 상담을 추가해주세요."
                  value={newConsultation.content}
                  onChange={(e) =>
                    setNewConsultation({
                      ...newConsultation,
                      content: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={16}
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
                    {contacts.map((contact: any) => {
                      if (!contact.resign)
                        return (
                          <option key={contact.id} value={contact.contact_name}>
                            {contact.contact_name} ({contact.level})
                          </option>
                        );
                    })}
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
                    {users.map((user: any) => (
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
                  {/* <th className="px-4 py-2 border-b border-r-[1px] text-center">
                    No.
                  </th> */}
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
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
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                    문서
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-2/12">
                    파일
                  </th>
                  <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                    변경
                  </th>
                  {/* <th className="px-4 py-2 border-b border-r-[1px] text-center w-1/12">
                    삭제
                  </th> */}
                </tr>
              </thead>
              <tbody>
                {processedConsultations.map((consultation: any, index: any) => (
                  <tr
                    key={consultation.id}
                    className="hover:bg-gray-100 border-b"
                  >
                    {/* <td className="px-4 py-2 border-r-[1px]">
                      {consultation.id.slice(0, 4)}
                    </td> */}
                    <td className="px-4 py-2 border-r-[1px]">
                      {consultation.date}
                    </td>
                    <td className="px-4 py-2 border-r-[1px]">
                      {consultation.contact_name} {consultation.contact_level}
                    </td>
                    <td className="px-4 py-2 border-r-[1px]">
                      {
                        users.find(
                          (user: any) => user.id === consultation.user_id
                        )?.name
                      }{" "}
                      {
                        users.find(
                          (user: any) => user.id === consultation.user_id
                        )?.level
                      }
                    </td>
                    <td
                      className="px-4 py-2 w-full text-start"
                      style={{
                        minHeight: "140px",
                        maxHeight: "140px",
                        overflowY: "auto",
                        display: "block",
                      }}
                    >
                      {formatContentWithLineBreaks(consultation.content)}
                    </td>
                    <td className="px-4 py-2 border-x-[1px]">
                      <p
                        className={`mb-4 cursor-pointer ${
                          consultation.documents.estimate
                            ? "text-blue-500 hover:font-bold"
                            : "text-gray-400 hover:text-black"
                        }`}
                        onClick={
                          () =>
                            router.push(
                              `/documents/estimate?consultId=${consultation.id}&compId=${companyDetail?.id}`
                            )
                          // window.open(
                          //   `/documents/estimate?consultId=${consultation.id}&compId=${companyDetail?.id}&fullscreen=true`,
                          //   "_blank",
                          //   "width=1200,height=800,top=100,left=100"
                          // )
                        }
                      >
                        견적서
                      </p>
                      <p
                        className={`my-4 cursor-pointer ${
                          consultation.documents.order
                            ? "text-blue-500 hover:font-bold"
                            : "text-gray-400 hover:text-black"
                        }`}
                        onClick={
                          () =>
                            router.push(
                              `/documents/order?consultId=${consultation.id}&compId=${companyDetail?.id}`
                            )
                          // window.open(
                          //   `/documents/order?consultId=${consultation.id}&compId=${companyDetail?.id}&fullscreen=true`,
                          //   "_blank",
                          //   "width=1200,height=800,top=100,left=100"
                          // )
                        }
                      >
                        발주서
                      </p>
                      <p
                        className={`mt-4 cursor-pointer ${
                          consultation.documents.requestQuote
                            ? "text-blue-500 hover:font-bold"
                            : "text-gray-400 hover:text-black"
                        }`}
                        onClick={
                          () =>
                            router.push(
                              `/documents/requestQuote?consultId=${consultation.id}&compId=${companyDetail?.id}`
                            )
                          // window.open(
                          //   `/documents/requestQuote?consultId=${consultation.id}&compId=${companyDetail?.id}&fullscreen=true`,
                          //   "_blank",
                          //   "width=1200,height=800,top=100,left=100"
                          // )
                        }
                      >
                        의뢰서
                      </p>
                    </td>
                    <td className="px-2 py-2 border-r-[1px]">
                      <FileUpload
                        consultationId={consultation.id}
                        userId={loginUser?.id}
                      />
                    </td>

                    {/* <td className="px-4 py-2 border-r-[1px]">
                      <span
                        className={`mr-2 cursor-pointer ${
                          consultation.documents.estimate
                            ? "text-blue-500 hover:font-bold"
                            : "text-gray-400 hover:text-black"
                        }`}
                        onClick={() =>
                          router.push(
                            `/documents/estimate?consultId=${consultation.id}&compId=${companyDetail?.id}`
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
                            `/documents/order?consultId=${consultation.id}&compId=${companyDetail?.id}`
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
                            `/documents/requestQuote?consultId=${consultation.id}&compId=${companyDetail?.id}`
                          )
                        }
                      >
                        의뢰서
                      </span>
                    </td> */}
                    <td>
                      <span
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
                      </span>
                      <span
                        className={`px-4 py-2 ${
                          loginUser?.id === consultation.user_id &&
                          "text-red-500 cursor-pointer"
                        }`}
                        // onClick={() => {
                        //   handleDeleteConsultation(consultation);
                        // }}
                        onClick={() => {
                          if (loginUser?.id === consultation.user_id)
                            handleDeleteConsultation(consultation);
                        }}
                      >
                        삭제
                      </span>
                    </td>
                    {/* <td
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
                    </td> */}
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
              className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
            >
              이전
            </button>

            {paginationNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => handlePageClick(Number(page))}
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
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
            >
              다음
            </button>
          </div>
        </div>
      </>

      {openDeleteModal && consultationToDelete && (
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
      {openEditNotesModal && (
        <>
          <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-md w-1/3">
              <h2 className="text-xl font-bold mb-4">비고 추가/수정</h2>
              <textarea
                placeholder="해당 거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요."
                className="w-full min-h-80 p-2 border border-gray-300 rounded-md"
                defaultValue={companyDetail.notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex justify-end mt-4">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
                  onClick={() => setOpenEditNotesModal(false)}
                >
                  취소
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                  onClick={handleUpdateNotes}
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {openEditContactsModal && (
        <>
          <div className="fixed inset-0 flex justify-center items-center bg-gray-500 bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-md w-4/6 overflow-y-scroll max-h-">
              <h2 className="text-xl font-bold ">담당자 추가/수정</h2>
              <div>
                <p>
                  담당자 삭제시 연관된 문서(견적서,발주서,의뢰서)가 존재할시
                  삭제되지 않습니다. 퇴사를 선택하면 담당자 선택 목록에 나타나지
                  않습니다.
                </p>
              </div>
              <div className="mt-4">
                {/* 📌 담당자 한 줄 표현 & 추가 버튼 클릭 시 맨 위로 */}
                <div className="space-y-2 max-h-96 overflow-y-scroll">
                  {contactsUi?.map((contact: any, index: any) => {
                    if (!contact.resign)
                      return (
                        <div
                          key={index}
                          className="flex flex-wrap md:flex-nowrap gap-4"
                        >
                          <motion.input
                            whileFocus={{
                              scale: 1.05, // 입력 시 약간 확대
                              boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                            }}
                            type="text"
                            value={contact?.contact_name || ""}
                            onChange={(e) =>
                              handleContactChange(
                                index,
                                "contact_name",
                                e.target.value
                              )
                            }
                            placeholder="이름"
                            className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                          />
                          <motion.input
                            whileFocus={{
                              scale: 1.05, // 입력 시 약간 확대
                              boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                            }}
                            type="text"
                            value={contact?.level || ""}
                            onChange={(e) =>
                              handleContactChange(
                                index,
                                "level",
                                e.target.value
                              )
                            }
                            placeholder="직급"
                            className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                          />

                          <motion.input
                            whileFocus={{
                              scale: 1.05, // 입력 시 약간 확대
                              boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                            }}
                            type="text"
                            value={contact?.department || ""}
                            onChange={(e) =>
                              handleContactChange(
                                index,
                                "department",
                                e.target.value
                              )
                            }
                            placeholder="부서"
                            className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                          />

                          <motion.input
                            whileFocus={{
                              scale: 1.05, // 입력 시 약간 확대
                              boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                            }}
                            type="text"
                            value={contact?.mobile || ""}
                            onChange={(e) =>
                              handleContactChange(
                                index,
                                "mobile",
                                e.target.value
                              )
                            }
                            placeholder="휴대폰"
                            className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                          />
                          <motion.input
                            whileFocus={{
                              scale: 1.05, // 입력 시 약간 확대
                              boxShadow: "0px 0px 8px rgba(0, 0, 0, 0.1)", // 그림자 효과
                            }}
                            type="email"
                            value={contact?.email || ""}
                            onChange={(e) =>
                              handleContactChange(
                                index,
                                "email",
                                e.target.value
                              )
                            }
                            placeholder="이메일"
                            className="p-2 border border-gray-300 rounded-md w-full md:w-auto"
                          />
                          <motion.label className="flex items-center space-x-2">
                            <motion.input
                              whileTap={{ scale: 0.9 }} // 클릭 시 약간 축소 효과
                              type="checkbox"
                              checked={contact?.resign || false}
                              onChange={(e) =>
                                handleContactChange(
                                  index,
                                  "resign",
                                  e.target.checked
                                )
                              }
                              className="w-5 h-5 accent-blue-500 cursor-pointer"
                            />
                            <span className="text-gray-700">퇴사</span>
                          </motion.label>

                          {/* <button
                      onClick={() => removeContact(index)}
                      className="px-4 py-2 bg-red-500 text-white text-xs md:text-sm rounded-md"
                    >
                      삭제
                    </button> */}
                        </div>
                      );
                  })}
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <div className="flex items-start mr-2 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 ">
                  <button
                    className=" text-xs md:text-sm rounded-md items-end"
                    onClick={addContact}
                  >
                    담당자 추가
                  </button>
                </div>

                <div>
                  <button
                    className="px-4 py-2 bg-gray-500 text-white rounded-md mr-2"
                    onClick={() => {
                      setContactsUi(contacts);
                      setOpenEditContactsModal(false);
                    }}
                  >
                    취소
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                    onClick={handleUpdateContacts}
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
