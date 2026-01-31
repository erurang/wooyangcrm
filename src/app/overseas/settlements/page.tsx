"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import {
  Calculator,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingDown,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useLoginUser } from "@/context/login";
import SnackbarComponent from "@/components/Snackbar";
import {
  ImportSettlement,
  ImportSettlementFormData,
} from "@/types/settlement";
import SettlementTable from "@/components/overseas/settlements/SettlementTable";
import SettlementFormModal from "@/components/overseas/settlements/SettlementFormModal";
import PendingBalanceCard from "@/components/overseas/settlements/PendingBalanceCard";

const emptyFormData: ImportSettlementFormData = {
  company_id: "",
  settlement_date: new Date().toISOString().split("T")[0],
  items: [],
  remittance_date: "",
  remittance_amount: "",
  remittance_currency: "KRW",
  tax_invoice_date: new Date().toISOString().split("T")[0],
  supply_amount: "",
  vat_amount: "",
  notes: "",
};

export default function SettlementsPage() {
  const loginUser = useLoginUser();
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "pending">("list");

  // 정산 목록 조회
  const {
    data: settlementsData,
    isLoading: settlementsLoading,
    mutate: refreshSettlements,
  } = useSWR<{ settlements: ImportSettlement[]; total: number }>(
    "/api/import-settlements?limit=50",
    (url) => fetcher(url, { arg: { method: "GET" } }),
    { revalidateOnFocus: false }
  );
  const settlements = settlementsData?.settlements || [];

  // 선송금 미입고 잔액 조회
  const { data: pendingData, isLoading: pendingLoading } = useSWR<{
    balance: Array<{
      company_id: string;
      company_name: string;
      consultations: Array<{
        id: string;
        oc_number: string;
        product_name: string;
        total_remittance: number;
        currency: string;
      }>;
      total_by_currency: Record<string, number>;
    }>;
    total_consultations: number;
  }>(
    "/api/import-settlements/pending-balance",
    (url) => fetcher(url, { arg: { method: "GET" } }),
    { revalidateOnFocus: false }
  );

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedSettlement, setSelectedSettlement] = useState<ImportSettlement | null>(null);
  const [formData, setFormData] = useState<ImportSettlementFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);

  // 정산 추가 모달 열기
  const handleOpenAddModal = useCallback(() => {
    setModalMode("add");
    setSelectedSettlement(null);
    setFormData(emptyFormData);
    setIsModalOpen(true);
  }, []);

  // 특정 거래처로 정산 추가 모달 열기
  const handleOpenAddModalWithCompany = useCallback((companyId: string) => {
    setModalMode("add");
    setSelectedSettlement(null);
    setFormData({
      ...emptyFormData,
      company_id: companyId,
    });
    setIsModalOpen(true);
  }, []);

  // 정산 수정 모달 열기
  const handleOpenEditModal = useCallback(async (settlement: ImportSettlement) => {
    setModalMode("edit");
    setSelectedSettlement(settlement);

    // 정산 상세 조회 (items 포함)
    try {
      const res = await fetch(`/api/import-settlements/${settlement.id}`);
      if (res.ok) {
        const data = await res.json();
        const detail = data.settlement;

        setFormData({
          company_id: detail.company_id,
          settlement_date: detail.settlement_date || "",
          items: (detail.items || []).map((item: any) => ({
            customs_cost_id: item.customs_cost_id,
            consultation_id: item.consultation_id,
            item_amount: item.item_amount || 0,
            item_currency: item.item_currency || "KRW",
          })),
          remittance_date: detail.remittance_date || "",
          remittance_amount: detail.remittance_amount || "",
          remittance_currency: detail.remittance_currency || "KRW",
          tax_invoice_date: detail.tax_invoice_date || "",
          supply_amount: detail.supply_amount || "",
          vat_amount: detail.vat_amount || "",
          notes: detail.notes || "",
        });
      }
    } catch (error) {
      console.error("정산 상세 조회 실패:", error);
    }

    setIsModalOpen(true);
  }, []);

  // 정산 저장
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (modalMode === "add") {
        await fetcher("/api/import-settlements", {
          arg: {
            method: "POST",
            body: {
              ...formData,
              created_by: loginUser?.id,
            },
          },
        });
        setSnackbarMessage("정산이 등록되었습니다.");
      } else {
        await fetcher(`/api/import-settlements/${selectedSettlement?.id}`, {
          arg: {
            method: "PATCH",
            body: formData,
          },
        });
        setSnackbarMessage("정산이 수정되었습니다.");
      }
      refreshSettlements();
      setIsModalOpen(false);
    } catch (error) {
      setSnackbarMessage("정산 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }, [modalMode, formData, selectedSettlement, loginUser?.id, refreshSettlements]);

  // 정산 완료 처리
  const handleSettle = useCallback(
    async (settlementId: string) => {
      try {
        await fetcher(`/api/import-settlements/${settlementId}`, {
          arg: {
            method: "PATCH",
            body: {
              status: "settled",
              settled_by: loginUser?.id,
            },
          },
        });
        setSnackbarMessage("정산이 완료되었습니다.");
        refreshSettlements();
      } catch (error) {
        setSnackbarMessage("정산 완료 처리에 실패했습니다.");
      }
    },
    [loginUser?.id, refreshSettlements]
  );

  // 정산 삭제
  const handleDelete = useCallback(
    async (settlementId: string) => {
      if (!confirm("정산을 삭제하시겠습니까?")) return;

      try {
        await fetcher(`/api/import-settlements/${settlementId}`, {
          arg: { method: "DELETE" },
        });
        setSnackbarMessage("정산이 삭제되었습니다.");
        refreshSettlements();
      } catch (error) {
        setSnackbarMessage("정산 삭제에 실패했습니다.");
      }
    },
    [refreshSettlements]
  );

  // 통계 계산
  const pendingCount = settlements.filter((s) => s.status === "pending").length;
  const settledCount = settlements.filter((s) => s.status === "settled").length;
  const totalExchangeLoss = settlements.reduce(
    (sum, s) => sum + (s.exchange_loss_customs || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 text-sm text-slate-800">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calculator size={20} className="text-teal-600" />
              <h1 className="text-lg font-bold text-slate-800">입고정산</h1>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus size={16} />
              정산 등록
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Clock size={16} />
              <span className="text-xs">정산 대기</span>
            </div>
            <div className="text-xl font-bold text-amber-600">{pendingCount}건</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <CheckCircle2 size={16} />
              <span className="text-xs">정산 완료</span>
            </div>
            <div className="text-xl font-bold text-emerald-600">{settledCount}건</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <TrendingDown size={16} />
              <span className="text-xs">환차손/통관료 합계</span>
            </div>
            <div className="text-xl font-bold text-slate-700">
              {totalExchangeLoss.toLocaleString()}원
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <AlertCircle size={16} />
              <span className="text-xs">선송금 미입고</span>
            </div>
            <div className="text-xl font-bold text-red-600">
              {pendingData?.total_consultations || 0}건
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-1">
            <button
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "list"
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              정산 목록
              {settlements.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full">
                  {settlements.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "pending"
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              선송금 미입고 잔액
              {(pendingData?.total_consultations || 0) > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                  {pendingData?.total_consultations}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === "list" && (
          <SettlementTable
            settlements={settlements}
            isLoading={settlementsLoading}
            onEdit={handleOpenEditModal}
            onSettle={handleSettle}
            onDelete={handleDelete}
          />
        )}

        {activeTab === "pending" && (
          <PendingBalanceCard
            data={pendingData?.balance || []}
            isLoading={pendingLoading}
            onCreateSettlement={(companyId) => {
              handleOpenAddModalWithCompany(companyId);
            }}
          />
        )}
      </div>

      <SnackbarComponent
        message={snackbarMessage}
        onClose={() => setSnackbarMessage("")}
      />

      <SettlementFormModal
        mode={modalMode}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSave}
        saving={saving}
      />
    </div>
  );
}
