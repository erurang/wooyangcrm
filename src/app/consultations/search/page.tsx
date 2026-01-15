"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useUsersList } from "@/hooks/useUserList";
import SnackbarComponent from "@/components/Snackbar";
import { useDebounce } from "@/hooks/useDebounce";
import { useConsultationSearch } from "@/hooks/consultations/search/useConsultationSearch";

import {
  ConsultationSearchFilter,
  ConsultationTableControls,
  ConsultationTable,
  ConsultationPagination,
  ConsultationDocumentModal,
} from "@/components/consultations/search";

interface Document {
  id: string;
  type: "estimate" | "requestQuote" | "order";
  document_number: string;
  content: {
    items: Array<{
      name: string;
      spec: string;
      quantity: number;
      unit_price: number;
      amount: number;
    }>;
  };
  // 새 외부 컬럼들
  company_name?: string;
  total_amount?: number;
  delivery_date?: string;
  valid_until?: string;
  delivery_place?: string;
  delivery_term?: string;
  notes?: string;
  // 모달용 추가 필드
  contact_name?: string;
  contact_level?: string;
  contact_mobile?: string;
  company_fax?: string;
  company_tel?: string;
  company_phone?: string;
  user_name?: string;
  user_level?: string;
  payment_method?: string;
}

interface UserType {
  id: string;
  name: string;
  level: string;
}

// 간단한 문서 타입 (ConsultationTable에서 사용)
interface SimpleDocument {
  id: string;
  type: "estimate" | "requestQuote" | "order";
  document_number: string;
}

// 상세 문서 타입 (API 응답)
interface SearchDocument {
  id: string;
  type: "estimate" | "requestQuote" | "order";
  document_number: string;
  content: {
    items: Array<{
      name: string;
      spec: string;
      quantity: number;
      unit_price: number;
      amount: number;
    }>;
    // content 내부 필드들
    company_name?: string;
    valid_until?: string;
    delivery_date?: string;
    total_amount?: number;
    notes?: string;
    delivery_term?: string;
    delivery_place?: string;
    payment_method?: string;
  };
  user_id?: string;
  created_at?: string;
  payment_method?: string;
  date?: string;
}

interface ContactInfo {
  contact_name: string;
  level: string;
  mobile: string;
}

interface ContactConsultation {
  contacts?: ContactInfo;
}

interface SearchConsultation {
  id: string;
  date: string;
  content: string;
  created_at: string;
  contact_name: string;
  contact_level: string;
  companies?: {
    id: string;
    name: string;
    fax?: string;
    phone?: string;
  };
  users?: {
    id: string;
    name: string;
    level: string;
  };
  documents: SearchDocument[];
  contacts_consultations?: ContactConsultation[];
  payment_method?: string;
}

export default function RecentConsultations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date().toISOString().split("T")[0];

  const initialPage = Number(searchParams.get("page") || "1");
  const initialSearchTerm = searchParams.get("search") || "";
  const initialStartDate = searchParams.get("startDate") || today;
  const initialEndDate = searchParams.get("endDate") || today;
  const initialUserId = searchParams.get("user") || "";
  const initialPerPage = Number(searchParams.get("perPage") || "10");

  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [consultationsPerPage, setConsultationsPerPage] = useState(initialPerPage);

  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const { users } = useUsersList();

  const updateUrl = () => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (searchTerm) params.set("search", searchTerm);
    if (startDate !== today) params.set("startDate", startDate);
    if (endDate !== today) params.set("endDate", endDate);
    if (selectedUser?.id) params.set("user", selectedUser.id);
    if (consultationsPerPage !== 10) params.set("perPage", consultationsPerPage.toString());

    const newUrl = `/consultations/search${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(newUrl, { scroll: false });
  };

  useEffect(() => {
    updateUrl();
  }, [currentPage, searchTerm, startDate, endDate, selectedUser, consultationsPerPage]);

  useEffect(() => {
    if (initialUserId && users.length > 0) {
      const user = users.find((u: UserType) => u.id === initialUserId) || null;
      setSelectedUser(user);
    }
  }, [initialUserId, users]);

  const debounceSearchTerm = useDebounce(searchTerm, 300);
  const debounceStartDate = useDebounce(startDate, 300);
  const debounceEndDate = useDebounce(endDate, 300);

  const { consultations, totalPages, isLoading: isConsultationsLoading } = useConsultationSearch({
    page: currentPage,
    limit: consultationsPerPage,
    selectedUser,
    startDate: debounceStartDate,
    endDate: debounceEndDate,
    content: debounceSearchTerm,
  });

  const handleDocumentClick = (document: SimpleDocument) => {
    const consultation = (consultations as SearchConsultation[])?.find((c) =>
      c.documents.some((doc) => doc.id === document.id)
    );
    if (!consultation) return;

    const doc = consultation.documents.find((d) => d.id === document.id);
    if (!doc) return;

    // 외부 컬럼 우선, content fallback으로 Document 구성
    const docAny = doc as SearchDocument & { companies?: { id: string; name: string }; total_amount?: number; valid_until?: string; delivery_date?: string; delivery_place?: string; delivery_term?: string; notes?: string };
    const baseDocument: Document = {
      id: doc.id,
      type: doc.type,
      document_number: doc.document_number,
      content: doc.content,
      // 외부 컬럼 우선, content fallback
      company_name: docAny.companies?.name || doc.content?.company_name || consultation.companies?.name || "",
      total_amount: docAny.total_amount ?? doc.content?.total_amount,
      valid_until: docAny.valid_until || doc.content?.valid_until,
      delivery_date: docAny.delivery_date || doc.content?.delivery_date,
      delivery_place: docAny.delivery_place || doc.content?.delivery_place,
      delivery_term: docAny.delivery_term || doc.content?.delivery_term,
      notes: docAny.notes || doc.content?.notes,
      // 상담/회사/담당자 정보
      contact_level: consultation.contact_level || "",
      contact_name: consultation.contact_name || "",
      user_name: consultation.users?.name || "",
      user_level: consultation.users?.level || "",
      company_fax: consultation.companies?.fax || "",
      company_phone: consultation.companies?.phone,
      contact_mobile: consultation.contacts_consultations?.[0]?.contacts?.mobile || "",
      payment_method: doc.payment_method || doc.content?.payment_method,
    };

    setSelectedDocument(baseDocument);

    setOpenModal(true);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStartDate(today);
    setEndDate(today);
    setSelectedUser(null);
    setCurrentPage(1);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="text-sm text-gray-800">
      <ConsultationSearchFilter
        searchTerm={searchTerm}
        onSearchTermChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        selectedUser={selectedUser}
        onUserChange={(user) => {
          setSelectedUser(user);
          setCurrentPage(1);
        }}
        users={users}
        onReset={resetFilters}
      />

      <ConsultationTableControls
        isLoading={isConsultationsLoading}
        totalPages={totalPages}
        perPage={consultationsPerPage}
        onPerPageChange={(val) => {
          setConsultationsPerPage(val);
          setCurrentPage(1);
        }}
      />

      <ConsultationTable
        consultations={consultations}
        isLoading={isConsultationsLoading}
        onDocumentClick={handleDocumentClick}
      />

      <ConsultationPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <ConsultationDocumentModal
        isOpen={openModal}
        document={selectedDocument}
        onClose={() => {
          setOpenModal(false);
          setSelectedDocument(null);
        }}
      />

      <SnackbarComponent message={snackbarMessage} onClose={() => setSnackbarMessage("")} />
    </div>
  );
}
