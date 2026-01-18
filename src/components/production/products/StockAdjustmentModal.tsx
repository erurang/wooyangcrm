"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, Plus, Minus, AlertCircle } from "lucide-react";
import type { Product } from "@/types/production";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSubmit: (quantity: number, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

type AdjustmentType = "add" | "subtract";

export default function StockAdjustmentModal({
  isOpen,
  product,
  onClose,
  onSubmit,
  isLoading = false,
}: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("add");
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (quantity <= 0) {
      setError("수량을 입력해주세요");
      return;
    }

    const adjustedQuantity = adjustmentType === "add" ? quantity : -quantity;

    // 재고 부족 체크
    if (product && adjustmentType === "subtract" && product.current_stock < quantity) {
      setError(`현재 재고(${product.current_stock})보다 많이 차감할 수 없습니다`);
      return;
    }

    try {
      await onSubmit(adjustedQuantity, notes || undefined);
      // Reset form
      setQuantity(0);
      setNotes("");
      setAdjustmentType("add");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    }
  };

  if (!isOpen || !product) return null;

  const expectedStock =
    adjustmentType === "add"
      ? product.current_stock + quantity
      : product.current_stock - quantity;

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
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Package className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">재고 조정</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Product Info */}
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">
                <span className="font-medium">{product.internal_name}</span>
                <span className="text-slate-400 ml-2">({product.internal_code})</span>
              </p>
              <p className="text-lg font-bold text-slate-800 mt-1">
                현재 재고: {product.current_stock.toLocaleString()} {product.unit}
              </p>
            </div>

            {/* Adjustment Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">조정 유형</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentType("add")}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                    adjustmentType === "add"
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-green-300"
                  }`}
                >
                  <Plus className="h-5 w-5" />
                  입고 (증가)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType("subtract")}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                    adjustmentType === "subtract"
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-red-300"
                  }`}
                >
                  <Minus className="h-5 w-5" />
                  출고 (감소)
                </button>
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                수량 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={quantity || ""}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={0}
                step={0.001}
                placeholder="0"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
              />
              {quantity > 0 && (
                <p className="mt-2 text-sm">
                  예상 재고:{" "}
                  <span
                    className={`font-bold ${
                      expectedStock < 0 ? "text-red-600" : "text-indigo-600"
                    }`}
                  >
                    {expectedStock.toLocaleString()} {product.unit}
                  </span>
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">사유</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="조정 사유를 입력하세요 (선택사항)"
                rows={2}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Footer */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading || quantity <= 0}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  adjustmentType === "add"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {isLoading ? "처리 중..." : adjustmentType === "add" ? "입고 처리" : "출고 처리"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
