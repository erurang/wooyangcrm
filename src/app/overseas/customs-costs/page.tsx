"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Download, Ship } from "lucide-react";

import SnackbarComponent from "@/components/Snackbar";
import {
  CustomsCostTable,
  CustomsCostFormModal,
  CustomsCostStats,
  CustomsCostFilters,
} from "@/components/overseas";
import {
  useCustomsCosts,
  useCustomsCostStats,
  useAddCustomsCost,
  useUpdateCustomsCost,
  useDeleteCustomsCost,
} from "@/hooks/overseas";
import {
  CustomsCost,
  CustomsCostFormData,
  ShippingMethodType,
} from "@/types/overseas";

const emptyFormData: CustomsCostFormData = {
  company_id: "",
  clearance_date: new Date().toISOString().split("T")[0],
  invoice_no: "",
  air_freight: "",
  sea_freight: "",
  customs_duty: "",
  port_charges: "",
  domestic_transport: "",
  express_freight: "",
  vat: "",
  shipping_method: "sea",
  forwarder: "",
  notes: "",
};

export default function CustomsCostsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터
  const initialPage = searchParams.get("page")
    ? parseInt(searchParams.get("page") as string)
    : 1;
  const initialYear = searchParams.get("year") || new Date().getFullYear().toString();
  const initialMonth = searchParams.get("month") || "";

  // 필터 상태
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [companyId, setCompanyId] = useState("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodType | "">("");
  const [forwarder, setForwarder] = useState("");

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState<CustomsCostFormData>(emptyFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // 기간 계산
  const startDate = month
    ? `${year}-${month.padStart(2, "0")}-01`
    : `${year}-01-01`;
  const endDate = month
    ? new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0]
    : `${year}-12-31`;

  // Hooks
  const { customsCosts, total, isLoading, mutate } = useCustomsCosts({
    page: currentPage,
    limit: itemsPerPage,
    companyId,
    shippingMethod,
    forwarder,
    startDate,
    endDate,
  });

  const { stats, isLoading: statsLoading } = useCustomsCostStats({
    year,
    month,
    companyId,
  });

  const { addCustomsCost } = useAddCustomsCost();
  const { updateCustomsCost } = useUpdateCustomsCost();
  const { deleteCustomsCost } = useDeleteCustomsCost();

  // URL 업데이트
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage !== 1) params.set("page", currentPage.toString());
    params.set("year", year);
    if (month) params.set("month", month);
    router.replace(`/overseas/customs-costs?${params.toString()}`);
  }, [currentPage, year, month, router]);

  // 페이지 수 업데이트
  useEffect(() => {
    if (!isLoading) {
      setTotalPages(Math.ceil(total / itemsPerPage));
    }
  }, [total, isLoading, itemsPerPage]);

  // 필터 초기화
  const resetFilters = () => {
    setMonth("");
    setCompanyId("");
    setShippingMethod("");
    setForwarder("");
    setCurrentPage(1);
  };

  // 통관비용 추가
  const handleAddCost = async () => {
    setSaving(true);
    try {
      await addCustomsCost(formData);
      setSnackbarMessage("통관비용이 추가되었습니다.");
      setIsAddModalOpen(false);
      setFormData(emptyFormData);
      mutate();
    } catch (error) {
      setSnackbarMessage("통관비용 추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 통관비용 수정
  const handleUpdateCost = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateCustomsCost({ id: editingId, data: formData });
      setSnackbarMessage("통관비용이 수정되었습니다.");
      setIsEditModalOpen(false);
      setFormData(emptyFormData);
      setEditingId(null);
      mutate();
    } catch (error) {
      setSnackbarMessage("통관비용 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 모달 열기
  const openAddModal = () => {
    setFormData(emptyFormData);
    setIsAddModalOpen(true);
  };

  const openEditModal = (cost: CustomsCost) => {
    setFormData({
      company_id: cost.company_id,
      clearance_date: cost.clearance_date,
      invoice_no: cost.invoice_no,
      air_freight: cost.air_freight || "",
      sea_freight: cost.sea_freight || "",
      customs_duty: cost.customs_duty || "",
      port_charges: cost.port_charges || "",
      domestic_transport: cost.domestic_transport || "",
      express_freight: cost.express_freight || "",
      vat: cost.vat || "",
      shipping_method: cost.shipping_method,
      forwarder: cost.forwarder,
      notes: cost.notes || "",
    });
    setEditingId(cost.id);
    setIsEditModalOpen(true);
  };

  // 삭제
  const handleDelete = async (cost: CustomsCost) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteCustomsCost({ id: cost.id });
      setSnackbarMessage("통관비용이 삭제되었습니다.");
      mutate();
    } catch (error) {
      setSnackbarMessage("통관비용 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="text-sm text-gray-800">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Ship size={24} className="text-blue-500" />
          <h1 className="text-xl font-semibold">통관비용 관리</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // TODO: 엑셀 다운로드 구현
              console.log("Download Excel");
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            엑셀 다운로드
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            통관비용 추가
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <CustomsCostStats stats={stats} isLoading={statsLoading} />

      {/* 필터 */}
      <CustomsCostFilters
        year={year}
        month={month}
        companyId={companyId}
        shippingMethod={shippingMethod}
        forwarder={forwarder}
        onYearChange={(y) => {
          setYear(y);
          setCurrentPage(1);
        }}
        onMonthChange={(m) => {
          setMonth(m);
          setCurrentPage(1);
        }}
        onCompanyIdChange={(c) => {
          setCompanyId(c);
          setCurrentPage(1);
        }}
        onShippingMethodChange={(s) => {
          setShippingMethod(s);
          setCurrentPage(1);
        }}
        onForwarderChange={(f) => {
          setForwarder(f);
          setCurrentPage(1);
        }}
        onReset={resetFilters}
      />

      {/* 테이블 */}
      <CustomsCostTable
        customsCosts={customsCosts}
        total={total}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onPerPageChange={setItemsPerPage}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onAdd={openAddModal}
      />

      {/* 추가 모달 */}
      <CustomsCostFormModal
        mode="add"
        isOpen={isAddModalOpen}
        formData={formData}
        setFormData={setFormData}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCost}
        saving={saving}
      />

      {/* 수정 모달 */}
      <CustomsCostFormModal
        mode="edit"
        isOpen={isEditModalOpen}
        formData={formData}
        setFormData={setFormData}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingId(null);
        }}
        onSubmit={handleUpdateCost}
        saving={saving}
      />

      {/* 스낵바 */}
      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />
    </div>
  );
}
