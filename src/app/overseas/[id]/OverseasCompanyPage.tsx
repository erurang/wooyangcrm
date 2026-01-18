"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Search,
  Plus,
  ChevronRight,
  Globe,
  Package,
  Paperclip,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useLoginUser } from "@/context/login";

import {
  useOverseasOrders,
  useAddOverseasOrder,
  useUpdateOverseasOrder,
  useDeleteOverseasOrder,
} from "@/hooks/overseas";
import SnackbarComponent from "@/components/Snackbar";
import OverseasCompanyInfoCard from "@/components/overseas/OverseasCompanyInfoCard";
import OverseasOrderFormModal from "@/components/overseas/OverseasOrderFormModal";
import OverseasOrderCard from "@/components/overseas/OverseasOrderCard";
import NotesEditModal from "@/components/consultations/modals/NotesEditModal";
import ContactsEditModal from "@/components/consultations/modals/ContactsEditModal";
import { useUsersList } from "@/hooks/useUserList";
import {
  OverseasContact,
  OverseasOrder,
  OverseasOrderFormData,
  OrderType,
} from "@/types/overseas";

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

type TabType = "orders" | "files";

// 초기 폼 데이터 생성
function getInitialOrderFormData(
  companyId: string,
  orderType: OrderType,
  userId: string = ""
): OverseasOrderFormData {
  return {
    company_id: companyId,
    order_type: orderType,
    invoice_no: "",
    order_date: new Date().toISOString().split("T")[0],
    shipment_date: "",
    arrival_date: "",
    currency: "USD",
    items: [{ name: "", spec: "", quantity: "", unit_price: 0, amount: 0 }],
    remittance_amount: "",
    remittance_date: "",
    exchange_rate: "",
    shipping_method: "",
    forwarder: "",
    hs_code: "",
    tariff_rate: "",
    contact_name: "",
    user_id: userId,
    notes: "",
  };
}

// OverseasOrder를 FormData로 변환
function orderToFormData(order: OverseasOrder): OverseasOrderFormData {
  return {
    id: order.id,
    company_id: order.company_id,
    order_type: order.order_type,
    invoice_no: order.invoice_no,
    order_date: order.order_date,
    shipment_date: order.shipment_date || "",
    arrival_date: order.arrival_date || "",
    currency: order.currency,
    items: order.items || [],
    remittance_amount: order.remittance_amount ?? "",
    remittance_date: order.remittance_date || "",
    exchange_rate: order.exchange_rate ?? "",
    shipping_method: order.shipping_method || "",
    forwarder: order.forwarder || "",
    hs_code: order.hs_code || "",
    tariff_rate: order.tariff_rate ?? "",
    contact_name: order.contact_name || "",
    user_id: order.user_id || "",
    notes: order.notes || "",
  };
}

export default function OverseasCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const loginUser = useLoginUser();
  const companyId =
    typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>("orders");

  // 수입/수출 필터
  const [orderType, setOrderType] = useState<OrderType>("import");

  // 검색
  const [searchTerm, setSearchTerm] = useState("");

  // 스낵바
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // 발주 모달
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalMode, setOrderModalMode] = useState<"add" | "edit">("add");
  const [orderFormData, setOrderFormData] = useState<OverseasOrderFormData>(
    getInitialOrderFormData(companyId, orderType)
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // 발주 추가/수정/삭제 hooks
  const { addOrder, isLoading: addingOrder } = useAddOverseasOrder();
  const { updateOrder, isLoading: updatingOrder } = useUpdateOverseasOrder();
  const { deleteOrder, isLoading: deletingOrder } = useDeleteOverseasOrder();

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

  // 발주 내역 조회
  const {
    orders,
    total,
    isLoading: ordersLoading,
    mutate: refreshOrders,
  } = useOverseasOrders({
    companyId,
    orderType,
    invoiceNo: searchTerm,
    limit: 50,
  });

  // 사용자 목록 조회
  const { users } = useUsersList();

  const company = companyData;
  const contacts = company?.contacts || [];

  // 발주 추가 모달 열기
  const handleOpenAddOrderModal = useCallback(() => {
    setOrderModalMode("add");
    setSelectedOrderId(null);
    setOrderFormData(getInitialOrderFormData(companyId, orderType, loginUser?.id));
    setIsOrderModalOpen(true);
  }, [companyId, orderType, loginUser?.id]);

  // 발주 수정 모달 열기 (테이블 행 클릭 시)
  const handleOpenEditOrderModal = useCallback((order: OverseasOrder) => {
    setOrderModalMode("edit");
    setSelectedOrderId(order.id);
    setOrderFormData(orderToFormData(order));
    setIsOrderModalOpen(true);
  }, []);

  // 발주 모달 닫기
  const handleCloseOrderModal = useCallback(() => {
    setIsOrderModalOpen(false);
    setSelectedOrderId(null);
  }, []);

  // 발주 저장 (추가/수정)
  const handleSaveOrder = useCallback(async () => {
    try {
      if (orderModalMode === "add") {
        await addOrder(orderFormData);
        setSnackbarMessage("발주가 추가되었습니다.");
      } else {
        if (!selectedOrderId) return;
        await updateOrder(selectedOrderId, orderFormData);
        setSnackbarMessage("발주가 수정되었습니다.");
      }
      setIsOrderModalOpen(false);
      setSelectedOrderId(null);
      refreshOrders();
    } catch (error) {
      setSnackbarMessage(
        orderModalMode === "add"
          ? "발주 추가에 실패했습니다."
          : "발주 수정에 실패했습니다."
      );
    }
  }, [
    orderModalMode,
    addOrder,
    updateOrder,
    orderFormData,
    selectedOrderId,
    refreshOrders,
  ]);

  // 발주 삭제 (모달에서)
  const handleDeleteOrder = useCallback(async () => {
    if (!selectedOrderId) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteOrder(selectedOrderId);
      setSnackbarMessage("발주가 삭제되었습니다.");
      setIsOrderModalOpen(false);
      setSelectedOrderId(null);
      refreshOrders();
    } catch (error) {
      setSnackbarMessage("발주 삭제에 실패했습니다.");
    }
  }, [deleteOrder, selectedOrderId, refreshOrders]);

  // 발주 삭제 (카드에서 직접)
  const handleDeleteOrderFromCard = useCallback(
    async (order: OverseasOrder) => {
      if (!confirm("정말 삭제하시겠습니까?")) return;

      try {
        await deleteOrder(order.id);
        setSnackbarMessage("발주가 삭제되었습니다.");
        refreshOrders();
      } catch (error) {
        setSnackbarMessage("발주 삭제에 실패했습니다.");
      }
    },
    [deleteOrder, refreshOrders]
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
      await fetcher(`/api/companies/update`, {
        arg: {
          method: "PATCH",
          body: {
            id: companyId,
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

      await fetcher(`/api/contacts/update`, {
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

            {/* 우측: 검색 + 발주 추가 */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Invoice No. 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48 py-1.5 pl-8 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 hover:bg-white focus:bg-white transition-colors"
                />
              </div>
              <button
                onClick={handleOpenAddOrderModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">발주 추가</span>
              </button>
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
              onClick={() => setActiveTab("orders")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "orders"
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Package size={16} />
              발주
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
        {activeTab === "orders" && (
          <>
            {/* 수입/수출 필터 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setOrderType("import")}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                    orderType === "import"
                      ? "bg-white text-teal-600 shadow-sm font-medium"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  수입 발주
                </button>
                <button
                  onClick={() => setOrderType("export")}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                    orderType === "export"
                      ? "bg-white text-teal-600 shadow-sm font-medium"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  수출
                </button>
              </div>
              <span className="text-sm text-slate-500">총 <span className="font-semibold text-teal-600">{total}</span>건</span>
            </div>

            {/* 발주 카드 목록 */}
            {ordersLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-slate-500">발주 내역을 불러오는 중...</p>
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order: OverseasOrder) => (
                  <OverseasOrderCard
                    key={order.id}
                    order={order}
                    users={users || []}
                    onEdit={handleOpenEditOrderModal}
                    onDelete={handleDeleteOrderFromCard}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl py-12 text-center">
                <Package size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">
                  {orderType === "import" ? "수입" : "수출"} 발주 내역이
                  없습니다.
                </p>
                <button
                  onClick={handleOpenAddOrderModal}
                  className="mt-4 text-teal-600 hover:text-teal-700 text-sm"
                >
                  첫 발주 추가하기
                </button>
              </div>
            )}
          </>
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

      {/* 발주 추가/수정 모달 */}
      <OverseasOrderFormModal
        mode={orderModalMode}
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
        formData={orderFormData}
        setFormData={setOrderFormData}
        onSubmit={handleSaveOrder}
        onDelete={orderModalMode === "edit" ? handleDeleteOrder : undefined}
        saving={addingOrder || updatingOrder}
        deleting={deletingOrder}
        contacts={contacts}
        orderId={selectedOrderId || undefined}
        invoiceNo={orderFormData.invoice_no}
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
    </div>
  );
}
