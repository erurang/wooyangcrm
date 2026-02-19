"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, AlertCircle } from "lucide-react";
import type { Product, ProductCreateRequest } from "@/types/production";

interface ProductFormModalProps {
  isOpen: boolean;
  product?: Product | null;
  defaultType?: "finished" | "raw_material" | "purchased";
  onClose: () => void;
  onSubmit: (data: ProductCreateRequest) => Promise<void>;
  isLoading?: boolean;
}

type ProductType = "finished" | "raw_material" | "purchased";

const typeLabels: Record<ProductType, string> = {
  finished: "완제품",
  raw_material: "원자재",
  purchased: "구매품",
};

export default function ProductFormModal({
  isOpen,
  product,
  defaultType = "raw_material",
  onClose,
  onSubmit,
  isLoading = false,
}: ProductFormModalProps) {
  const isEditing = !!product;

  // Form state
  const [internalCode, setInternalCode] = useState("");
  const [internalName, setInternalName] = useState("");
  const [type, setType] = useState<ProductType>(defaultType);
  const [category, setCategory] = useState("");
  const [spec, setSpec] = useState("");
  const [unit, setUnit] = useState("개");
  const [description, setDescription] = useState("");
  const [currentStock, setCurrentStock] = useState(0);
  const [minStockAlert, setMinStockAlert] = useState<number | undefined>(undefined);
  const [unitPrice, setUnitPrice] = useState<number | undefined>(undefined);
  const [error, setError] = useState("");

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen) {
      if (product) {
        setInternalCode(product.internal_code);
        setInternalName(product.internal_name);
        setType(product.type as ProductType);
        setCategory(product.category || "");
        setSpec(product.spec || "");
        setUnit(product.unit || "개");
        setDescription(product.description || "");
        setCurrentStock(product.current_stock || 0);
        setMinStockAlert(product.min_stock_alert || undefined);
        setUnitPrice(product.unit_price || undefined);
      } else {
        setInternalCode("");
        setInternalName("");
        setType(defaultType);
        setCategory("");
        setSpec("");
        setUnit("개");
        setDescription("");
        setCurrentStock(0);
        setMinStockAlert(undefined);
        setUnitPrice(undefined);
      }
      setError("");
    }
  }, [isOpen, product, defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!internalCode.trim()) {
      setError("제품 코드를 입력해주세요");
      return;
    }

    if (!internalName.trim()) {
      setError("제품명을 입력해주세요");
      return;
    }

    const data: ProductCreateRequest = {
      internal_code: internalCode.trim(),
      internal_name: internalName.trim(),
      type,
      category: category.trim() || undefined,
      spec: spec.trim() || undefined,
      unit: unit.trim() || "개",
      description: description.trim() || undefined,
      current_stock: type !== "finished" ? currentStock : 0,
      min_stock_alert: type !== "finished" ? minStockAlert : undefined,
      unit_price: unitPrice,
    };

    try {
      await onSubmit(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Package className="h-5 w-5 text-sky-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                {isEditing ? "제품 수정" : "새 제품 등록"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* 제품 유형 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                제품 유형 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {(Object.keys(typeLabels) as ProductType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    disabled={isEditing}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      type === t
                        ? "bg-sky-600 text-white border-sky-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
                    } ${isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {typeLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* 제품 코드 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                제품 코드 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={internalCode}
                onChange={(e) => setInternalCode(e.target.value)}
                placeholder="예: RAW-001"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* 제품명 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                제품명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={internalName}
                onChange={(e) => setInternalName(e.target.value)}
                placeholder="제품명을 입력하세요"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* 카테고리 & 단위 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">카테고리</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="예: 부자재"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">단위</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="개"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* 규격 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">규격</label>
              <input
                type="text"
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                placeholder="예: 100mm x 50mm"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* 재고 관련 (원자재/구매품만) */}
            {type !== "finished" && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">현재 재고</label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    min={0}
                    step={0.001}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    최소 재고 알림
                  </label>
                  <input
                    type="number"
                    value={minStockAlert ?? ""}
                    onChange={(e) =>
                      setMinStockAlert(e.target.value ? Number(e.target.value) : undefined)
                    }
                    min={0}
                    step={0.001}
                    placeholder="미설정"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            )}

            {/* 단가 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">기본 단가</label>
              <input
                type="number"
                value={unitPrice ?? ""}
                onChange={(e) => setUnitPrice(e.target.value ? Number(e.target.value) : undefined)}
                min={0}
                placeholder="미설정"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* 설명 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="제품에 대한 추가 설명"
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? "저장 중..." : isEditing ? "수정" : "등록"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
