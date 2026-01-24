"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Package,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";
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
import OverseasOrderFormModal from "@/components/overseas/OverseasOrderFormModal";
import OverseasOrderCard from "@/components/overseas/OverseasOrderCard";
import { useUsersList } from "@/hooks/useUserList";
import { useDebounce } from "@/hooks/useDebounce";
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import {
  OverseasOrder,
  OverseasOrderFormData,
  OverseasContact,
  OrderType,
  CURRENCY_SYMBOLS,
} from "@/types/overseas";

interface OverseasCompanyOption {
  id: string;
  name: string;
  contacts?: OverseasContact[];
}

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

export default function OverseasOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginUser = useLoginUser();

  // URL 파라미터
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialOrderType = (searchParams.get("type") as OrderType) || "";
  const initialCompanyId = searchParams.get("companyId") || "";
  const initialSearch = searchParams.get("search") || "";

  // 상태
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [ordersPerPage, setOrdersPerPage] = useState(20);
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderType | "">(initialOrderType);
  const [companyIdFilter, setCompanyIdFilter] = useState(initialCompanyId);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // 스낵바
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // 발주 모달
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderModalMode, setOrderModalMode] = useState<"add" | "edit">("add");
  const [orderFormData, setOrderFormData] = useState<OverseasOrderFormData>(
    getInitialOrderFormData("", "import")
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // 발주 추가/수정/삭제 hooks
  const { addOrder, isLoading: addingOrder } = useAddOverseasOrder();
  const { updateOrder, isLoading: updatingOrder } = useUpdateOverseasOrder();
  const { deleteOrder, isLoading: deletingOrder } = useDeleteOverseasOrder();

  // 해외 거래처 목록 조회
  const { data: companiesData } = useSWR<{ companies: OverseasCompanyOption[] }>(
    "/api/companies/overseas?limit=500",
    (url) => fetcher(url, { arg: { method: "GET" } }),
    { revalidateOnFocus: false }
  );
  const companies = companiesData?.companies || [];

  // 발주 목록 조회
  const {
    orders,
    total,
    isLoading,
    mutate: refreshOrders,
  } = useOverseasOrders({
    page: currentPage,
    limit: ordersPerPage,
    orderType: orderTypeFilter || undefined,
    companyId: companyIdFilter || undefined,
    invoiceNo: debouncedSearch || undefined,
  });

  // 사용자 목록 조회
  const { users } = useUsersList();

  // 총 페이지 수
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / ordersPerPage)), [total, ordersPerPage]);

  // 선택된 거래처의 담당자 목록
  const selectedCompanyContacts = useMemo(() => {
    if (!orderFormData.company_id) return [];
    const company = companies.find((c) => c.id === orderFormData.company_id);
    return company?.contacts || [];
  }, [orderFormData.company_id, companies]);

  // 필터 초기화
  const handleResetFilters = useCallback(() => {
    setOrderTypeFilter("");
    setCompanyIdFilter("");
    setSearchTerm("");
    setCurrentPage(1);
  }, []);

  // 발주 추가 모달 열기
  const handleOpenAddOrderModal = useCallback(() => {
    setOrderModalMode("add");
    setSelectedOrderId(null);
    setOrderFormData(getInitialOrderFormData("", "import", loginUser?.id));
    setIsOrderModalOpen(true);
  }, [loginUser?.id]);

  // 발주 수정 모달 열기
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
    if (!orderFormData.company_id) {
      setSnackbarMessage("거래처를 선택해주세요.");
      return;
    }

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
  }, [orderModalMode, addOrder, updateOrder, orderFormData, selectedOrderId, refreshOrders]);

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

  // 발주 삭제 (카드에서)
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

  // 페이지 변경
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // 필터 여부
  const hasFilters = orderTypeFilter || companyIdFilter || searchTerm;

  return (
    <div className="min-h-screen bg-slate-50 text-sm text-slate-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* 헤더 */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-4 py-3">
            {/* 타이틀 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 rounded-lg">
                  <Package className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800">해외 발주 관리</h1>
                  <p className="text-xs text-slate-500">해외 거래처 발주 내역을 관리합니다</p>
                </div>
              </div>
              <button
                onClick={handleOpenAddOrderModal}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus size={16} />
                발주 추가
              </button>
            </div>

            {/* 필터 */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 검색 */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors"
                  placeholder="Invoice No. 검색..."
                />
              </div>

              {/* 수입/수출 필터 */}
              <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setOrderTypeFilter("");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    !orderTypeFilter
                      ? "bg-white text-teal-600 shadow-sm font-medium"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => {
                    setOrderTypeFilter("import");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    orderTypeFilter === "import"
                      ? "bg-white text-teal-600 shadow-sm font-medium"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  수입
                </button>
                <button
                  onClick={() => {
                    setOrderTypeFilter("export");
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    orderTypeFilter === "export"
                      ? "bg-white text-teal-600 shadow-sm font-medium"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  수출
                </button>
              </div>

              {/* 거래처 필터 */}
              <div className="w-48">
                <HeadlessSelect
                  value={companyIdFilter}
                  onChange={(val) => {
                    setCompanyIdFilter(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "", label: "전체 거래처" },
                    ...companies.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  placeholder="거래처 선택"
                  icon={<Building2 className="h-4 w-4" />}
                />
              </div>

              {/* 초기화 */}
              {hasFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={14} />
                  초기화
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 결과 요약 */}
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            총 <span className="font-semibold text-teal-600">{total}</span>건
          </span>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">페이지당</span>
            <select
              value={ordersPerPage}
              onChange={(e) => {
                setOrdersPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* 발주 목록 */}
        <div className="px-4 pb-6">
          {isLoading ? (
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
                  showCompanyName
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl py-12 text-center">
              <Package size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">발주 내역이 없습니다.</p>
              <button
                onClick={handleOpenAddOrderModal}
                className="mt-4 text-teal-600 hover:text-teal-700 text-sm"
              >
                첫 발주 추가하기
              </button>
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-teal-600 text-white"
                          : "hover:bg-slate-100 text-slate-600"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* 스낵바 */}
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
        contacts={selectedCompanyContacts}
        orderId={selectedOrderId || undefined}
        invoiceNo={orderFormData.invoice_no}
      />

      {/* 거래처 선택 모달 (추가 모드 시 표시) */}
      {isOrderModalOpen && orderModalMode === "add" && !orderFormData.company_id && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-5 border-b">
              <h3 className="text-lg font-semibold text-gray-900">거래처 선택</h3>
              <p className="text-sm text-gray-500 mt-1">
                발주를 추가할 거래처를 선택해주세요.
              </p>
            </div>

            <div className="p-5 max-h-80 overflow-y-auto">
              <div className="space-y-2">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => {
                      setOrderFormData({
                        ...orderFormData,
                        company_id: company.id,
                      });
                    }}
                    className="w-full p-3 text-left rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-teal-500 transition-colors"
                  >
                    <div className="font-medium text-slate-800">{company.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end px-5 py-4 bg-gray-50 border-t">
              <button
                onClick={handleCloseOrderModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
