"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  ChevronRight,
  Globe,
  Paperclip,
  MessageCircle,
  Table2,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useLoginUser } from "@/context/login";

import SnackbarComponent from "@/components/Snackbar";
import OverseasCompanyInfoCard from "@/components/overseas/OverseasCompanyInfoCard";
import NotesEditModal from "@/components/consultations/modals/NotesEditModal";
import ContactsEditModal from "@/components/consultations/modals/ContactsEditModal";
import { useUsersList } from "@/hooks/useUserList";
import {
  OverseasContact,
  OverseasConsultation,
  OverseasConsultationFormData,
} from "@/types/overseas";
import OverseasConsultationModal from "@/components/overseas/OverseasConsultationModal";
import OverseasConsultationTable from "@/components/overseas/OverseasConsultationTable";
import OverseasConsultationSpreadsheet from "@/components/overseas/OverseasConsultationSpreadsheet";

// ContactsEditModal에서 사용하는 Contact 인터페이스
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

interface OverseasCompanyDetail {
  id: string;
  name: string;
  address?: string;
  email?: string;
  website?: string;
  notes?: string;
  contacts?: OverseasContact[];
  is_overseas: boolean;
  created_at: string;
}

type TabType = "consultations" | "spreadsheet" | "files";

// 상담 폼 초기값
function getInitialConsultationFormData(
  companyId: string,
  userId: string = ""
): OverseasConsultationFormData {
  const today = new Date().toISOString().split("T")[0];
  return {
    company_id: companyId,
    order_type: "", // 기본값 선택없음
    date: today,
    title: "",
    content: "",
    contact_id: "",
    user_id: userId,
    // 거래 정보 필드
    order_date: today, // 발주일 기본값 = 오늘
    expected_completion_date: "",
    pickup_date: "",
    arrival_date: "",
    oc_number: "",
    product_name: "",
    specification: "",
    quantity: "",
    total_remittance: "",
    currency: "",
    remittance_date: "",
    shipping_method: "",
    shipping_carrier_id: "",
    incoterms: "",
    trade_status: "",
    packaging_width: "",
    packaging_height: "",
    packaging_depth: "",
    packaging_type: "",
    packaging_weight: "",
    remarks: "",
  };
}

// OverseasConsultation을 FormData로 변환
function consultationToFormData(
  consultation: OverseasConsultation
): OverseasConsultationFormData {
  return {
    id: consultation.id,
    company_id: consultation.company_id,
    order_type: consultation.order_type || "",
    date: consultation.date,
    title: consultation.title || "",
    content: consultation.content,
    contact_id: consultation.contact_id || "",
    user_id: consultation.user_id || "",
    // 거래 정보 필드
    order_date: consultation.order_date || "",
    expected_completion_date: consultation.expected_completion_date || "",
    pickup_date: consultation.pickup_date || "",
    arrival_date: consultation.arrival_date || "",
    oc_number: consultation.oc_number || "",
    product_name: consultation.product_name || "",
    specification: consultation.specification || "",
    quantity: consultation.quantity || "",
    total_remittance: consultation.total_remittance ?? "",
    currency: consultation.currency || "",
    remittance_date: consultation.remittance_date || "",
    shipping_method: consultation.shipping_method || "",
    shipping_carrier_id: consultation.shipping_carrier_id || "",
    incoterms: consultation.incoterms || "",
    trade_status: consultation.trade_status || "",
    packaging_width: consultation.packaging_width ?? "",
    packaging_height: consultation.packaging_height ?? "",
    packaging_depth: consultation.packaging_depth ?? "",
    packaging_type: consultation.packaging_type || "",
    packaging_weight: consultation.packaging_weight ?? "",
    remarks: consultation.remarks || "",
  };
}

export default function OverseasCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const loginUser = useLoginUser();
  const companyId =
    typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>("consultations");

  // 스낵바
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // 비고 수정 모달
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // 담당자 관리 모달
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [editingContacts, setEditingContacts] = useState<Contact[]>([]);
  const [originalContacts, setOriginalContacts] = useState<Contact[]>([]);
  const [savingContacts, setSavingContacts] = useState(false);

  // 회사 정보 조회
  const {
    data: companyData,
    isLoading: companyLoading,
    mutate: refreshCompany,
  } = useSWR<OverseasCompanyDetail>(
    companyId ? `/api/companies/details?companyId=${companyId}` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    { revalidateOnFocus: false }
  );

  // 사용자 목록 조회
  const { users } = useUsersList();

  // 상담 목록 조회
  const {
    data: consultationsData,
    isLoading: consultationsLoading,
    mutate: refreshConsultations,
  } = useSWR<{ consultations: OverseasConsultation[]; total: number }>(
    companyId ? `/api/overseas/consultations?company_id=${companyId}&limit=50` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    { revalidateOnFocus: false }
  );
  const consultations = consultationsData?.consultations || [];

  // 상담 모달
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [consultationModalMode, setConsultationModalMode] = useState<"add" | "edit">("add");
  const [consultationFormData, setConsultationFormData] = useState<OverseasConsultationFormData>(
    getInitialConsultationFormData(companyId)
  );
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);
  const [savingConsultation, setSavingConsultation] = useState(false);
  const [deletingConsultation, setDeletingConsultation] = useState(false);

  const company = companyData;
  const contacts = company?.contacts || [];

  // 상담 추가 모달 열기
  const handleOpenAddConsultationModal = useCallback(() => {
    setConsultationModalMode("add");
    setSelectedConsultationId(null);
    setConsultationFormData(getInitialConsultationFormData(companyId, loginUser?.id));
    setIsConsultationModalOpen(true);
  }, [companyId, loginUser?.id]);

  // 상담 수정 모달 열기
  const handleOpenEditConsultationModal = useCallback((consultation: OverseasConsultation) => {
    console.log("[OverseasCompanyPage] Opening edit modal for consultation:", consultation);
    console.log("[OverseasCompanyPage] consultation.contact_id:", consultation.contact_id);
    const formData = consultationToFormData(consultation);
    console.log("[OverseasCompanyPage] Converted formData:", formData);

    setConsultationModalMode("edit");
    setSelectedConsultationId(consultation.id);
    setConsultationFormData(formData);
    setIsConsultationModalOpen(true);
  }, []);

  // 상담 모달 닫기
  const handleCloseConsultationModal = useCallback(() => {
    setIsConsultationModalOpen(false);
    setSelectedConsultationId(null);
  }, []);

  // 상담 저장 (추가/수정) - 반환값으로 consultationId 전달
  const handleSaveConsultation = useCallback(async (): Promise<string | null> => {
    setSavingConsultation(true);
    try {
      // 거래 정보 필드 공통
      const tradeFields = {
        order_date: consultationFormData.order_date || null,
        expected_completion_date: consultationFormData.expected_completion_date || null,
        pickup_date: consultationFormData.pickup_date || null,
        arrival_date: consultationFormData.arrival_date || null,
        oc_number: consultationFormData.oc_number || null,
        product_name: consultationFormData.product_name || null,
        specification: consultationFormData.specification || null,
        quantity: consultationFormData.quantity || null,
        total_remittance: consultationFormData.total_remittance || null,
        currency: consultationFormData.currency || null,
        remittance_date: consultationFormData.remittance_date || null,
        shipping_method: consultationFormData.shipping_method || null,
        shipping_carrier_id: consultationFormData.shipping_carrier_id || null,
        trade_status: consultationFormData.trade_status || null,
        packaging_width: consultationFormData.packaging_width || null,
        packaging_height: consultationFormData.packaging_height || null,
        packaging_depth: consultationFormData.packaging_depth || null,
        packaging_type: consultationFormData.packaging_type || null,
        packaging_weight: consultationFormData.packaging_weight || null,
        remarks: consultationFormData.remarks || null,
      };

      if (consultationModalMode === "add") {
        // 새 상담 등록
        const response = await fetcher("/api/overseas/consultations", {
          arg: {
            method: "POST",
            body: {
              company_id: consultationFormData.company_id,
              user_id: consultationFormData.user_id,
              order_type: consultationFormData.order_type || null,
              date: consultationFormData.date,
              title: consultationFormData.title || null,
              content: consultationFormData.content,
              contact_id: consultationFormData.contact_id || null,
              ...tradeFields,
            },
          },
        }) as { consultation?: { id: string } };
        setSnackbarMessage("상담이 등록되었습니다.");
        refreshConsultations();
        return response.consultation?.id || null;
      } else {
        // 상담 수정
        if (!selectedConsultationId) return null;

        const patchBody = {
          order_type: consultationFormData.order_type || null,
          date: consultationFormData.date,
          title: consultationFormData.title || null,
          content: consultationFormData.content,
          user_id: consultationFormData.user_id,
          contact_id: consultationFormData.contact_id || null,
          ...tradeFields,
        };

        await fetcher(`/api/consultations/${selectedConsultationId}`, {
          arg: {
            method: "PATCH",
            body: patchBody,
          },
        });
        setSnackbarMessage("상담이 수정되었습니다.");
        refreshConsultations();
        return selectedConsultationId;
      }
    } catch (error) {
      setSnackbarMessage(
        consultationModalMode === "add"
          ? "상담 등록에 실패했습니다."
          : "상담 수정에 실패했습니다."
      );
      return null;
    } finally {
      setSavingConsultation(false);
    }
  }, [
    consultationModalMode,
    consultationFormData,
    selectedConsultationId,
    refreshConsultations,
  ]);

  // 상담 삭제
  const handleDeleteConsultation = useCallback(async () => {
    if (!selectedConsultationId) return;
    if (!confirm("상담을 삭제하시겠습니까?")) return;

    setDeletingConsultation(true);
    try {
      await fetcher(`/api/consultations/${selectedConsultationId}`, {
        arg: { method: "DELETE" },
      });
      setSnackbarMessage("상담이 삭제되었습니다.");
      setIsConsultationModalOpen(false);
      setSelectedConsultationId(null);
      refreshConsultations();
    } catch (error) {
      setSnackbarMessage("상담 삭제에 실패했습니다.");
    } finally {
      setDeletingConsultation(false);
    }
  }, [selectedConsultationId, refreshConsultations]);

  // 상담 삭제 (카드에서 직접)
  const handleDeleteConsultationFromCard = useCallback(
    async (consultation: OverseasConsultation) => {
      if (!confirm("상담을 삭제하시겠습니까?")) return;

      try {
        await fetcher(`/api/consultations/${consultation.id}`, {
          arg: { method: "DELETE" },
        });
        setSnackbarMessage("상담이 삭제되었습니다.");
        refreshConsultations();
      } catch (error) {
        setSnackbarMessage("상담 삭제에 실패했습니다.");
      }
    },
    [refreshConsultations]
  );

  // 비고 수정 모달 열기
  const handleOpenNotesModal = useCallback(() => {
    setEditingNotes(company?.notes || "");
    setIsNotesModalOpen(true);
  }, [company?.notes]);

  // 비고 저장
  const handleSaveNotes = useCallback(async () => {
    setSavingNotes(true);
    try {
      await fetcher(`/api/companies/${companyId}`, {
        arg: {
          method: "PATCH",
          body: {
            notes: editingNotes,
          },
        },
      });
      setSnackbarMessage("비고가 저장되었습니다.");
      setIsNotesModalOpen(false);
      refreshCompany();
    } catch (error) {
      setSnackbarMessage("비고 저장에 실패했습니다.");
    } finally {
      setSavingNotes(false);
    }
  }, [companyId, editingNotes, refreshCompany]);

  // OverseasContact를 Contact로 변환하는 함수
  const convertToContacts = useCallback(
    (overseasContacts: OverseasContact[]): Contact[] => {
      return overseasContacts.map((c, index) => ({
        id: c.id || "",
        contact_name: c.name,
        mobile: c.mobile || "",
        department: c.department || "",
        level: c.position || "",
        email: c.email || "",
        resign: false,
        sort_order: index,
        company_id: companyId,
      }));
    },
    [companyId]
  );

  // 담당자 관리 모달 열기
  const handleOpenContactsModal = useCallback(() => {
    const converted = convertToContacts(contacts);
    setEditingContacts(converted);
    setOriginalContacts(converted);
    setIsContactsModalOpen(true);
  }, [contacts, convertToContacts]);

  // 담당자 저장
  const handleSaveContacts = useCallback(async () => {
    setSavingContacts(true);
    try {
      // 순서 업데이트
      const contactsWithOrder = editingContacts.map((c, index) => ({
        ...c,
        sort_order: index,
        company_id: companyId,
      }));

      await fetcher(`/api/contacts`, {
        arg: {
          method: "PUT",
          body: {
            companyId,
            contact: contactsWithOrder,
          },
        },
      });
      setSnackbarMessage("담당자 정보가 저장되었습니다.");
      setIsContactsModalOpen(false);
      refreshCompany();
    } catch (error) {
      setSnackbarMessage("담당자 저장에 실패했습니다.");
    } finally {
      setSavingContacts(false);
    }
  }, [companyId, editingContacts, refreshCompany]);

  if (companyLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-500">거래처 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-20">
        <p className="text-slate-500">거래처를 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push("/overseas")}
          className="mt-4 text-teal-600 hover:text-teal-700"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-sm text-slate-800">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* 좌측: 브레드크럼 */}
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href="/overseas"
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors shrink-0"
              >
                해외거래처
              </Link>
              <ChevronRight size={14} className="text-slate-400 shrink-0" />
              <div className="flex items-center gap-2 min-w-0">
                <Globe size={18} className="text-teal-600 shrink-0" />
                <h1 className="text-lg font-bold text-slate-800 truncate">
                  {company.name || "거래처 상세"}
                </h1>
              </div>
            </div>

            {/* 우측: 추가 버튼 */}
            <div className="flex items-center gap-2 shrink-0">
              {(activeTab === "consultations" || activeTab === "spreadsheet") && (
                <button
                  onClick={handleOpenAddConsultationModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">상담 등록</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* 거래처 정보 카드 */}
        <OverseasCompanyInfoCard
          companyDetail={company}
          contacts={contacts}
          isLoading={companyLoading}
          onEditNotes={handleOpenNotesModal}
          onEditContacts={handleOpenContactsModal}
          onEditCompany={() => {
            // TODO: 거래처 정보 수정 모달
          }}
        />

        {/* 탭 네비게이션 */}
        <div className="mb-4 border-b border-slate-200">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab("consultations")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "consultations"
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <MessageCircle size={16} />
              상담
              {consultations.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                  {consultations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("spreadsheet")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "spreadsheet"
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Table2 size={16} />
              리스트
            </button>
            <button
              onClick={() => setActiveTab("files")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "files"
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Paperclip size={16} />
              파일
            </button>
          </nav>
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === "spreadsheet" && (
          <OverseasConsultationSpreadsheet
            consultations={consultations}
            users={users || []}
            loginUserId={loginUser?.id || ""}
            isLoading={consultationsLoading}
            onEditConsultation={handleOpenEditConsultationModal}
            onDeleteConsultation={handleDeleteConsultationFromCard}
            onAddConsultation={handleOpenAddConsultationModal}
          />
        )}

        {/* 상담 탭 */}
        {activeTab === "consultations" && (
          <OverseasConsultationTable
            consultations={consultations}
            users={users || []}
            loginUserId={loginUser?.id || ""}
            isLoading={consultationsLoading}
            onEditConsultation={handleOpenEditConsultationModal}
            onDeleteConsultation={handleDeleteConsultationFromCard}
            onAddConsultation={handleOpenAddConsultationModal}
          />
        )}

        {activeTab === "files" && (
          <div className="bg-white border border-slate-200 rounded-xl py-12 text-center">
            <Paperclip size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">파일 기능은 준비 중입니다.</p>
          </div>
        )}
      </div>

      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />

      {/* 비고 수정 모달 */}
      <NotesEditModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        notes={editingNotes}
        setNotes={setEditingNotes}
        onSave={handleSaveNotes}
        saving={savingNotes}
      />

      {/* 담당자 관리 모달 */}
      <ContactsEditModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
        contacts={editingContacts}
        setContacts={setEditingContacts}
        originalContacts={originalContacts}
        onSave={handleSaveContacts}
        saving={savingContacts}
      />

      {/* 상담 등록/수정 모달 */}
      {(() => {
        console.log("[OverseasCompanyPage] Rendering modal with contacts:", contacts);
        console.log("[OverseasCompanyPage] Contacts count:", contacts.length);
        console.log("[OverseasCompanyPage] Current formData:", consultationFormData);
        return null;
      })()}
      <OverseasConsultationModal
        mode={consultationModalMode}
        isOpen={isConsultationModalOpen}
        onClose={handleCloseConsultationModal}
        formData={consultationFormData}
        setFormData={setConsultationFormData}
        onSubmit={handleSaveConsultation}
        onDelete={consultationModalMode === "edit" ? handleDeleteConsultation : undefined}
        onComplete={refreshConsultations}
        saving={savingConsultation}
        deleting={deletingConsultation}
        contacts={contacts}
        users={users || []}
        consultationId={selectedConsultationId || undefined}
      />
    </div>
  );
}
