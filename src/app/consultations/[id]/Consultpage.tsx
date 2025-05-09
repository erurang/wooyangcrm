"use client";
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
import { useUpdateContacts } from "@/hooks/manage/customers/useUpdateContacts";
import { useDebounce } from "@/hooks/useDebounce";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Search,
  Star,
  StarOff,
  Plus,
  Edit,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  X,
} from "lucide-react";

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
  sort_order: null | number;
  company_id?: string;
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
  parcel?: string;
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

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedConsultation, setSelectedConsultation] =
    useState<Consultation | null>(null);

  const [openEditNotesModal, setOpenEditNotesModal] = useState(false);
  const [openEditContactsModal, setOpenEditContactsModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [consultationToDelete, setConsultationToDelete] =
    useState<Consultation | null>(null);

  // SWR Hooks
  const { users } = useUsersList();
  const { favorites, removeFavorite, refetchFavorites, addFavorite } =
    useFavorites(loginUser?.id);
  const { consultations, totalPages, refreshConsultations } =
    useConsultationsList(id as string, currentPage, debouncedSearchTerm);
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

  const [notes, setNotes] = useState(companyDetail?.notes || "");
  const [contactsUi, setContactsUi] = useState<any>(contacts ?? []);
  const { updateContacts } = useUpdateContacts();

  // 비고 업데이트 핸들러
  const handleUpdateNotes = async () => {
    if (!companyDetail?.id) return;

    try {
      setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  // 상담 내역 처리
  const processedConsultations = useMemo(() => {
    return consultations?.map((consultation: any) => {
      const contactRelation = contactsConsultations.find(
        (cc: any) => cc.consultation_id === consultation.id
      );
      const firstContact: any = contactRelation?.contacts || {};

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
        documents: documentTypes,
      };
    });
  }, [consultations, contactsConsultations]);

  // 상담 추가 핸들러
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

      const selectedContact = contacts.find(
        (c: Contact) => c.contact_name === contact_name
      );

      if (!selectedContact) {
        throw new Error("담당자 정보를 찾을 수 없습니다.");
      }

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

  // 상담 수정 핸들러
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

  // 상담 업데이트 핸들러
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

  // 상담 삭제 핸들러
  const handleDeleteConsultation = async (consultation: Consultation) => {
    setConsultationToDelete(consultation);
    setOpenDeleteModal(true);
  };

  // 삭제 확인 핸들러
  const handleConfirmDelete = async () => {
    if (!consultationToDelete) return;
    if (deleteReason.length === 0) return;

    try {
      setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  // 페이지네이션 핸들러
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

  // 즐겨찾기 핸들러
  const handleAddFavorite = async () => {
    try {
      await addFavorite(loginUser?.id, id, companyDetail?.name);
      await refetchFavorites();
      setSnackbarMessage("즐겨찾기에 추가되었습니다.");
    } catch (error) {
      console.error("Error adding favorite:", error);
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

  // 담당자 관리
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
      await updateContacts(contactsUi, contacts[0]?.company_id);
      await refreshContacts();
      await refreshContactsConsultations();
      setSnackbarMessage("담당자 정보 수정 완료");
      setOpenEditContactsModal(false);
    } catch (error) {
      console.error("Error updating contacts:", error);
      setSnackbarMessage("담당자 정보 수정 실패");
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

  // DnD 관련 설정
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = contactsUi.findIndex(
        (contact: Contact, idx: number) => (contact.id || idx) === active.id
      );
      const newIndex = contactsUi.findIndex(
        (contact: Contact, idx: number) => (contact.id || idx) === over?.id
      );
      setContactsUi((items: any) => arrayMove(items, oldIndex, newIndex));
    }
  };

  // 기타 유틸리티 함수
  const formatContentWithLineBreaks = (content: string) => {
    return content.split("\n").map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  // 초기 설정
  useEffect(() => {
    const defaultContactName =
      contacts.length > 0
        ? contacts[0].contact_name
        : newConsultation.contact_name;
    const defaultUserId = loginUser?.id ?? newConsultation.user_id;

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

  return (
    <div className="bg-white text-gray-800 min-h-screen">
      {/* 헤더 섹션 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="py-3 px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                {companyDetail?.name || "거래처 상세"}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="상담 내용 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full py-1.5 pl-10 pr-4 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setOpenAddModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                <Plus size={16} />
                <span>상담 추가</span>
              </button>
              {favorites.find(
                (fav: any) => fav.name === companyDetail?.name
              ) ? (
                <button
                  onClick={() => {
                    if (companyDetail?.id) {
                      handleRemoveFavorite(companyDetail.id);
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-yellow-600 bg-yellow-50 rounded-md hover:bg-yellow-100 transition-colors"
                >
                  <StarOff size={16} />
                  <span>즐겨찾기 삭제</span>
                </button>
              ) : (
                <button
                  onClick={handleAddFavorite}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Star size={16} />
                  <span>즐겨찾기 추가</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* 거래처 정보 요약 - 더 컴팩트한 디자인 */}
        <div className="bg-white rounded-lg border shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
            {/* 거래처 기본 정보 */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-gray-900">
                  거래처 정보
                </h2>
              </div>

              {isCompanyDetailLoading ? (
                <div className="space-y-2">
                  <Skeleton variant="text" width="100%" height={20} />
                  <Skeleton variant="text" width="100%" height={20} />
                  <Skeleton variant="text" width="100%" height={20} />
                </div>
              ) : (
                <div className="space-y-1 text-sm">
                  <div className="flex items-start">
                    <span className="w-16 text-xs font-medium text-gray-500">
                      회사명
                    </span>
                    <span className="flex-1 text-gray-900">
                      {companyDetail?.name}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-16 text-xs font-medium text-gray-500">
                      주소
                    </span>
                    <span className="flex-1 text-gray-900">
                      {companyDetail?.address || "정보 없음"}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-16 text-xs font-medium text-gray-500">
                      배송
                    </span>
                    <span className="flex-1 text-gray-900">
                      {companyDetail?.parcel || "정보 없음"}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-16 text-xs font-medium text-gray-500">
                      전화
                    </span>
                    <span className="flex-1 text-gray-900">
                      {companyDetail?.phone || "정보 없음"}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-16 text-xs font-medium text-gray-500">
                      팩스
                    </span>
                    <span className="flex-1 text-gray-900">
                      {companyDetail?.fax || "정보 없음"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 비고 정보 */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-gray-900">비고</h2>
                <button
                  onClick={() => setOpenEditNotesModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                >
                  수정
                </button>
              </div>

              {isCompanyDetailLoading ? (
                <Skeleton variant="rectangular" width="100%" height={80} />
              ) : (
                <div className="text-sm text-gray-700 max-h-24 overflow-y-auto">
                  {companyDetail?.notes ? (
                    formatContentWithLineBreaks(companyDetail.notes)
                  ) : (
                    <p className="text-gray-500 italic text-xs">
                      비고 정보가 없습니다. '수정' 버튼을 클릭하여 추가하세요.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 담당자 정보 */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-gray-900">
                  담당자
                </h2>
                <button
                  onClick={() => setOpenEditContactsModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                >
                  관리
                </button>
              </div>

              {isCompanyDetailLoading ? (
                <Skeleton variant="rectangular" width="100%" height={80} />
              ) : (
                <div className="max-h-24 overflow-y-auto">
                  {contacts && contacts.length > 0 ? (
                    <div className="space-y-2">
                      {contacts.map((contact: Contact, index: number) => {
                        if (!contact.resign) {
                          return (
                            <div key={contact.id || index} className="text-sm">
                              <div className="flex items-center">
                                <div
                                  className="font-medium text-blue-600 cursor-pointer hover:underline"
                                  onClick={() =>
                                    router.push(
                                      `/manage/contacts/${contact.id}`
                                    )
                                  }
                                >
                                  {contact.contact_name}{" "}
                                  {contact.level && `(${contact.level})`}
                                </div>
                              </div>
                              <div className="mt-0.5 text-xs text-gray-500">
                                {contact.department &&
                                  `${contact.department} · `}
                                {contact.mobile || "-"}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-xs">
                      담당자 정보가 없습니다. '관리' 버튼을 클릭하여 추가하세요.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 상담 내역 섹션 */}
        <div className="bg-white rounded-lg border shadow-sm mb-6">
          {/* 상담 내역 테이블 */}
          <div className="overflow-x-auto">
            {consultations && consultations.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 table-fixed sm:table-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 sm:w-20"
                    >
                      날짜
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 sm:w-24"
                    >
                      담당자
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28 sm:w-24 hidden sm:table-cell"
                    >
                      상담자
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      내용
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 sm:w-16"
                    >
                      문서
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 sm:w-16"
                    >
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedConsultations.map(
                    (consultation: any, index: number) => (
                      <tr key={consultation.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:w-auto">
                          <div>{consultation.date}</div>
                          {consultation.follow_up_date && (
                            <div className="text-xs text-gray-500 mt-1">
                              ~ {consultation.follow_up_date}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:w-auto">
                          {consultation.contact_name}{" "}
                          {consultation.contact_level}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:w-auto hidden sm:table-cell">
                          {
                            users.find(
                              (user: User) => user.id === consultation.user_id
                            )?.name
                          }{" "}
                          {
                            users.find(
                              (user: User) => user.id === consultation.user_id
                            )?.level
                          }
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900 sm:w-auto">
                          <div className="max-h-32 overflow-y-auto w-screen md:w-auto">
                            {formatContentWithLineBreaks(consultation.content)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm sm:w-auto">
                          <div className="space-y-2">
                            <button
                              className={`block w-full text-left px-2 py-1 rounded ${
                                consultation.documents.estimate
                                  ? "text-blue-600 hover:bg-blue-50"
                                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                              }`}
                              onClick={() =>
                                window.open(
                                  `/documents/estimate?consultId=${consultation.id}&compId=${companyDetail?.id}&fullscreen=true`,
                                  "_blank",
                                  "width=1200,height=800,top=100,left=100"
                                )
                              }
                            >
                              <span className="flex items-center">
                                <FileText size={14} className="mr-1.5" />
                                견적서
                              </span>
                            </button>

                            <button
                              className={`block w-full text-left px-2 py-1 rounded ${
                                consultation.documents.order
                                  ? "text-blue-600 hover:bg-blue-50"
                                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                              }`}
                              onClick={() =>
                                window.open(
                                  `/documents/order?consultId=${consultation.id}&compId=${companyDetail?.id}&fullscreen=true`,
                                  "_blank",
                                  "width=1200,height=800,top=100,left=100"
                                )
                              }
                            >
                              <span className="flex items-center">
                                <FileText size={14} className="mr-1.5" />
                                발주서
                              </span>
                            </button>

                            <button
                              className={`block w-full text-left px-2 py-1 rounded ${
                                consultation.documents.requestQuote
                                  ? "text-blue-600 hover:bg-blue-50"
                                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                              }`}
                              onClick={() =>
                                window.open(
                                  `/documents/requestQuote?consultId=${consultation.id}&compId=${companyDetail?.id}&fullscreen=true`,
                                  "_blank",
                                  "width=1200,height=800,top=100,left=100"
                                )
                              }
                            >
                              <span className="flex items-center">
                                <FileText size={14} className="mr-1.5" />
                                의뢰서
                              </span>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:w-auto">
                          {loginUser?.id === consultation.user_id && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  handleEditConsultation(consultation)
                                }
                                className="text-blue-600 hover:text-blue-800"
                                title="수정"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteConsultation(consultation)
                                }
                                className="text-red-600 hover:text-red-800"
                                title="삭제"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-gray-500">
                {debouncedSearchTerm
                  ? "검색 결과가 없습니다."
                  : "상담 내역이 없습니다."}
              </div>
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t flex items-center justify-center">
              <nav className="flex items-center space-x-1">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`px-2 py-1 rounded-md ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>

                {paginationNumbers().map((page, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      typeof page === "number" && handlePageClick(page)
                    }
                    className={`px-3 py-1 rounded-md ${
                      currentPage === page
                        ? "bg-blue-600 text-white"
                        : page === "..."
                        ? "text-gray-500 cursor-default"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    disabled={page === "..."}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`px-2 py-1 rounded-md ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* 모달: 상담 추가 */}
      <AnimatePresence>
        {openAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  상담 내역 추가
                </h3>
                <button
                  onClick={() => setOpenAddModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상담일
                    </label>
                    <input
                      type="date"
                      value={newConsultation.date}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      담당자
                    </label>
                    <select
                      value={newConsultation.contact_name}
                      onChange={(e) =>
                        setNewConsultation({
                          ...newConsultation,
                          contact_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">담당자 선택</option>
                      {contacts.map((contact: Contact) => {
                        if (!contact.resign)
                          return (
                            <option
                              key={contact.id}
                              value={contact.contact_name}
                            >
                              {contact.contact_name}{" "}
                              {contact.level && `(${contact.level})`}
                            </option>
                          );
                        return null;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상담자
                    </label>
                    <select
                      value={newConsultation.user_id}
                      disabled
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm"
                    >
                      {users.map((user: User) => (
                        <option key={user.id} value={user.id}>
                          {user.name} {user.level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상담 내용
                  </label>
                  <textarea
                    placeholder="상담 내용을 입력하세요..."
                    value={newConsultation.content}
                    onChange={(e) =>
                      setNewConsultation({
                        ...newConsultation,
                        content: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={10}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    담당자를 선택 후 상담을 작성해주세요. 후속 날짜를 설정하면
                    지정날짜 7일 전에 대시보드의 후속 상담 필요 고객 리스트에
                    표시됩니다.
                  </p>
                </div>
              </div>

              <div className="flex justify-end items-center gap-3 px-5 py-4 bg-gray-50 border-t">
                <button
                  onClick={() => setOpenAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={handleAddConsultation}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <CircularProgress size={16} className="mr-2" />
                      저장 중...
                    </>
                  ) : (
                    "저장"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 모달: 상담 수정 */}
      <AnimatePresence>
        {openEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  상담 내역 수정
                </h3>
                <button
                  onClick={() => setOpenEditModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상담일
                    </label>
                    <input
                      type="date"
                      value={newConsultation.date}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      후속 날짜
                    </label>
                    <input
                      type="date"
                      value={newConsultation.follow_up_date || ""}
                      onChange={(e) =>
                        setNewConsultation({
                          ...newConsultation,
                          follow_up_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      담당자
                    </label>
                    <select
                      value={newConsultation.contact_name}
                      onChange={(e) =>
                        setNewConsultation({
                          ...newConsultation,
                          contact_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">담당자 선택</option>
                      {contacts.map((contact: Contact) => {
                        if (!contact.resign)
                          return (
                            <option
                              key={contact.id}
                              value={contact.contact_name}
                            >
                              {contact.contact_name}{" "}
                              {contact.level && `(${contact.level})`}
                            </option>
                          );
                        return null;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상담자
                    </label>
                    <select
                      value={newConsultation.user_id}
                      disabled
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm"
                    >
                      {users.map((user: User) => (
                        <option key={user.id} value={user.id}>
                          {user.name} {user.level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={10}
                  />
                </div>
              </div>

              <div className="flex justify-end items-center gap-3 px-5 py-4 bg-gray-50 border-t">
                <button
                  onClick={() => setOpenEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateConsultation}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <CircularProgress size={16} className="mr-2" />
                      저장 중...
                    </>
                  ) : (
                    "저장"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 모달: 상담 삭제 */}
      <AnimatePresence>
        {openDeleteModal && consultationToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  삭제 요청
                </h3>
              </div>

              <div className="p-5">
                <p className="mb-4 text-sm text-gray-600">
                  상담 내역을 삭제하시려면 삭제 사유를 입력해주세요.
                </p>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="삭제 사유를 입력해주세요."
                  rows={5}
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end items-center gap-3 px-5 py-4 bg-gray-50 border-t">
                <button
                  onClick={() => setOpenDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={saving || !deleteReason.trim()}
                >
                  {saving ? (
                    <>
                      <CircularProgress size={16} className="mr-2" />
                      처리 중...
                    </>
                  ) : (
                    "삭제 요청"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 모달: 비고 수정 */}
      <AnimatePresence>
        {openEditNotesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  비고 추가/수정
                </h3>
                <button
                  onClick={() => setOpenEditNotesModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5">
                <textarea
                  placeholder="해당 거래처의 유의사항 또는 담당자별 유의사항을 작성해주세요."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={12}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end items-center gap-3 px-5 py-4 bg-gray-50 border-t">
                <button
                  onClick={() => setOpenEditNotesModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateNotes}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <CircularProgress size={16} className="mr-2" />
                      저장 중...
                    </>
                  ) : (
                    "저장"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 모달: 담당자 관리 */}
      <AnimatePresence>
        {openEditContactsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  담당자 관리
                </h3>
                <button
                  onClick={() => setOpenEditContactsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5">
                <p className="mb-4 text-sm text-gray-600">
                  담당자 정보를 관리합니다. 순서를 변경하려면 드래그하여
                  이동하세요. 퇴사를 선택하면 담당자 선택 목록에 나타나지
                  않습니다.
                </p>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={contactsUi.map(
                      (contact: Contact, idx: number) => contact.id || idx
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3 max-h-96 overflow-y-auto p-1">
                      {contactsUi?.map((contact: Contact, index: number) => {
                        if (!contact.resign)
                          return (
                            <SortableContactItem
                              key={contact.id || index}
                              contact={contact}
                              index={index}
                              handleContactChange={handleContactChange}
                            />
                          );
                        return null;
                      })}
                    </div>
                  </SortableContext>
                </DndContext>

                <button
                  onClick={addContact}
                  className="mt-4 flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <Plus size={16} />
                  <span>담당자 추가</span>
                </button>
              </div>

              <div className="flex justify-end items-center gap-3 px-5 py-4 bg-gray-50 border-t">
                <button
                  onClick={() => {
                    setContactsUi(contacts);
                    setOpenEditContactsModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={saving}
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateContacts}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <CircularProgress size={16} className="mr-2" />
                      저장 중...
                    </>
                  ) : (
                    "저장"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 알림 메시지 */}
      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}

function SortableContactItem({
  contact,
  index,
  handleContactChange,
}: {
  contact: Contact;
  index: number;
  handleContactChange: (
    index: number,
    field: keyof Contact,
    value: any
  ) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: contact.id || index,
    });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex flex-wrap md:flex-nowrap gap-3">
        <div className="cursor-grab flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-gray-600">
          <GripVertical size={18} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 w-full">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              이름
            </label>
            <input
              type="text"
              value={contact?.contact_name || ""}
              onChange={(e) =>
                handleContactChange(index, "contact_name", e.target.value)
              }
              placeholder="이름"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              직급
            </label>
            <input
              type="text"
              value={contact?.level || ""}
              onChange={(e) =>
                handleContactChange(index, "level", e.target.value)
              }
              placeholder="직급"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              부서
            </label>
            <input
              type="text"
              value={contact?.department || ""}
              onChange={(e) =>
                handleContactChange(index, "department", e.target.value)
              }
              placeholder="부서"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              휴대폰
            </label>
            <input
              type="text"
              value={contact?.mobile || ""}
              onChange={(e) =>
                handleContactChange(index, "mobile", e.target.value)
              }
              placeholder="휴대폰"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              이메일
            </label>
            <input
              type="email"
              value={contact?.email || ""}
              onChange={(e) =>
                handleContactChange(index, "email", e.target.value)
              }
              placeholder="이메일"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-end pb-1">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={contact?.resign || false}
              onChange={(e) =>
                handleContactChange(index, "resign", e.target.checked)
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">퇴사</span>
          </label>
        </div>
      </div>
    </div>
  );
}
