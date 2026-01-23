"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Factory,
  Calendar,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Filter,
  Package,
} from "lucide-react";
import HeadlessSelect from "@/components/ui/HeadlessSelect";
import { useLoginUser } from "@/context/login";
import { useProductionRecords } from "@/hooks/production/useProductionRecords";
import { useFinishedProducts, useRawMaterials, usePurchasedProducts } from "@/hooks/production/useProducts";
import { useDebounce } from "@/hooks/useDebounce";
import type { ProductionRecordCreateRequest, ProductionRecordFilter } from "@/types/production";

type StatusFilter = "all" | "completed" | "canceled";

export default function ProductionRecordsPage() {
  const user = useLoginUser();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build filter
  const filters: ProductionRecordFilter = {
    status: statusFilter === "all" ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  };

  const { records, isLoading, createRecord, cancelRecord, refresh } = useProductionRecords(filters);
  const { products: finishedProducts } = useFinishedProducts({ is_active: true });
  const { products: rawMaterials } = useRawMaterials({ is_active: true });
  const { products: purchasedProducts } = usePurchasedProducts({ is_active: true });
  const allMaterials = [...rawMaterials, ...purchasedProducts];

  // Form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantityProduced, setQuantityProduced] = useState<number>(0);
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split("T")[0]);
  const [batchNumber, setBatchNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setSelectedProductId("");
    setQuantityProduced(0);
    setProductionDate(new Date().toISOString().split("T")[0]);
    setBatchNumber("");
    setNotes("");
    setFormError("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedProductId) {
      setFormError("제품을 선택해주세요");
      return;
    }

    if (quantityProduced <= 0) {
      setFormError("생산 수량을 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      // Find the product and its BOM
      const product = finishedProducts.find((p) => p.id === selectedProductId);
      const consumptions = product?.materials?.map((m) => ({
        material_id: m.material_id,
        quantity_consumed: m.quantity_required * quantityProduced,
      })) || [];

      const data: ProductionRecordCreateRequest = {
        product_id: selectedProductId,
        quantity_produced: quantityProduced,
        production_date: productionDate,
        batch_number: batchNumber || undefined,
        notes: notes || undefined,
        created_by: user?.id,
        consumptions,
      };

      await createRecord(data);
      resetForm();
      setIsFormModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (recordId: string) => {
    if (!confirm("이 생산 기록을 취소하시겠습니까? 소비된 원자재가 복구됩니다.")) return;
    setIsSubmitting(true);
    try {
      await cancelRecord(recordId, user?.id, "관리자 취소");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected product info for BOM preview
  const selectedProduct = finishedProducts.find((p) => p.id === selectedProductId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Factory className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">생산 기록</h1>
                <p className="text-xs text-slate-500">생산 이력 및 원자재 소비 기록</p>
              </div>
            </div>
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              생산 기록
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="제품명, 배치번호 검색..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <HeadlessSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as StatusFilter)}
            options={[
              { value: "all", label: "전체 상태" },
              { value: "completed", label: "완료" },
              { value: "canceled", label: "취소됨" },
            ]}
            placeholder="상태 선택"
            icon={<Filter className="h-4 w-4" />}
            focusClass="focus:ring-emerald-500"
          />

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <span className="text-slate-400">~</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-emerald-600 border-t-transparent rounded-full" />
          </div>
        ) : records.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Factory className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              생산 기록이 없습니다
            </h3>
            <p className="text-sm text-slate-400 mb-4">새 생산 기록을 등록해보세요</p>
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              생산 기록 등록
            </button>
          </motion.div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">날짜</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">제품</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">수량</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">배치번호</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">상태</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record, index) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`hover:bg-slate-50 ${record.status === "canceled" ? "bg-red-50" : ""}`}
                  >
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(record.production_date).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{record.product?.internal_name}</p>
                      <p className="text-xs text-slate-400">{record.product?.internal_code}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-slate-800">
                        {record.quantity_produced.toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-sm ml-1">{record.product?.unit}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {record.batch_number || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {record.status === "canceled" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          <XCircle className="h-3 w-3" />
                          취소됨
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          <CheckCircle2 className="h-3 w-3" />
                          완료
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {record.status !== "canceled" && (
                        <button
                          onClick={() => handleCancel(record.id)}
                          disabled={isSubmitting}
                          className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          취소
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsFormModalOpen(false)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Factory className="h-5 w-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">새 생산 기록</h2>
              </div>
              <button
                onClick={() => {
                  setIsFormModalOpen(false);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {formError}
                </div>
              )}

              {/* Product Select */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  제품 <span className="text-red-500">*</span>
                </label>
                <HeadlessSelect
                  value={selectedProductId}
                  onChange={(val) => setSelectedProductId(val)}
                  options={finishedProducts.map((p) => ({
                    value: p.id,
                    label: p.internal_name,
                    sublabel: p.internal_code,
                  }))}
                  placeholder="제품 선택"
                  icon={<Package className="h-4 w-4" />}
                  focusClass="focus:ring-emerald-500"
                />
              </div>

              {/* Quantity & Date */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    생산 수량 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={quantityProduced || ""}
                    onChange={(e) => setQuantityProduced(Number(e.target.value))}
                    min={0}
                    step={0.001}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    생산일자 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={productionDate}
                    onChange={(e) => setProductionDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Batch Number */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">배치번호</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="예: BATCH-2024-001"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">비고</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="추가 메모"
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* BOM Preview */}
              {selectedProduct && selectedProduct.materials && selectedProduct.materials.length > 0 && quantityProduced > 0 && (
                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 mb-2">소비 예정 원자재</p>
                  <div className="space-y-1">
                    {selectedProduct.materials.map((material) => {
                      const materialInfo = allMaterials.find((m) => m.id === material.material_id);
                      const consumeQty = material.quantity_required * quantityProduced;
                      const currentStock = materialInfo?.current_stock || 0;
                      const isInsufficient = consumeQty > currentStock;

                      return (
                        <div
                          key={material.id}
                          className={`flex justify-between text-sm p-2 rounded ${
                            isInsufficient ? "bg-red-100 text-red-700" : "bg-white"
                          }`}
                        >
                          <span>{materialInfo?.internal_name || "알 수 없음"}</span>
                          <span>
                            {consumeQty} {materialInfo?.unit}
                            {isInsufficient && ` (재고 부족: ${currentStock})`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "처리 중..." : "등록"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
