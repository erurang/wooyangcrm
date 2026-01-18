"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useUsersList } from "@/hooks/useUserList";
import SnackbarComponent from "@/components/Snackbar";
import { useCompanySearch } from "@/hooks/manage/contacts/useCompanySearch";
import { useDebounce } from "@/hooks/useDebounce";
import { useFollowUpList } from "@/hooks/consultations/follow/useFollowUpList";

import { FollowSearchFilter, FollowTable } from "@/components/consultations/follow";
import { RecentTableControls, RecentDocumentModal } from "@/components/consultations/recent";
import { ConsultationPagination } from "@/components/consultations/search";

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

interface Company {
  id: string;
  name: string;
}

// 간단한 문서 타입 (FollowTable에서 사용)
interface SimpleDocument {
  id: string;
  type: "estimate" | "requestQuote" | "order";
  document_number: string;
}

// 상세 문서 타입 (API 응답)
interface FollowUpDocument {
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

interface FollowUpConsultation {
  id: string;
  date: string;
  follow_up_date: string;
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
  documents: FollowUpDocument[];
  contacts_consultations?: ContactConsultation[];
  payment_method?: string;
}

export default function FollowUpConsultations() {
  const today = new Date().toISOString().split("T")[0];
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [currentPage, setCurrentPage] = useState(1);
  const [consultationsPerPage, setConsultationsPerPage] = useState(10);

  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const { users } = useUsersList();

  const debounceSearchTerm = useDebounce(searchTerm, 300);
  const { companies } = useCompanySearch(debounceSearchTerm);

  const companyIds = companies.map((company: Company) => company.id);
  const debounceCompanyIds = useDebounce(companyIds, 300);
  const debounceStartDate = useDebounce(startDate, 300);
  const debounceEndDate = useDebounce(endDate, 300);

  const { consultations, totalPages, isLoading: isConsultationsLoading } = useFollowUpList({
    page: currentPage,
    limit: consultationsPerPage,
    selectedUser,
    startDate: debounceStartDate,
    endDate: debounceEndDate,
    companyIds: debounceCompanyIds,
  });

  const handleDocumentClick = (document: SimpleDocument) => {
    const consultation = (consultations as FollowUpConsultation[])?.find((c) =>
      c.documents.some((doc) => doc.id === document.id)
    );
    if (!consultation) return;

    const doc = consultation.documents.find((d) => d.id === document.id);
    if (!doc) return;

    // 외부 컬럼 우선, content fallback으로 Document 구성
    const docAny = doc as FollowUpDocument & { companies?: { id: string; name: string }; total_amount?: number; valid_until?: string; delivery_date?: string; delivery_place?: string; delivery_term?: string; notes?: string };
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
    <div className="min-h-screen bg-slate-50 text-sm text-slate-800">
      <FollowSearchFilter
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

      <RecentTableControls
        isLoading={isConsultationsLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        perPage={consultationsPerPage}
        onPerPageChange={(val: number) => {
          setConsultationsPerPage(val);
          setCurrentPage(1);
        }}
      />

      <FollowTable
        consultations={consultations}
        isLoading={isConsultationsLoading}
        onDocumentClick={handleDocumentClick}
      />

      <ConsultationPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <RecentDocumentModal
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
