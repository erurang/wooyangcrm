"use client";

import { useState } from "react";
import { X, Scissors, ArrowRight, Package, AlertCircle, Loader2 } from "lucide-react";
import type { InventoryLotWithDetails } from "@/types/inventory";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useLotMutations } from "@/hooks/inventory/useLots";
import { useLoginUser } from "@/context/login";

interface LotSplitModalProps {
  lot: InventoryLotWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LotSplitModal({
  lot,
  isOpen,
  onClose,
  onSuccess,
}: LotSplitModalProps) {
  const loginUser = useLoginUser();
  const { splitLot, isSplitting } = useLotMutations();

  const [splitQuantity, setSplitQuantity] = useState<string>("");
  const [reason, setReason] = useState<string>("order");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");

  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const currentQty = lot.current_quantity;
  const splitQty = parseFloat(splitQuantity) || 0;
  const remnantQty = currentQty - splitQty;
  const unit = lot.unit || lot.product?.unit || "개";

  const isValid = splitQty > 0 && splitQty < currentQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValid) {
      setError("분할 수량이 유효하지 않습니다.");
      return;
    }

    const result = await splitLot(lot.id, {
      source_lot_id: lot.id,
      split_quantity: splitQty,
      reason,
      notes: notes || undefined,
      user_id: loginUser?.id,
    });

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "분할 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-orange-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <Scissors className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800">LOT 분할</h3>
              <p className="text-sm text-slate-400">{lot.lot_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSplitting}
            className="p-2 hover:bg-orange-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-6">
          {/* 현재 LOT 정보 */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">원본 LOT</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-800">
                  {lot.product?.internal_name || "-"}
                </div>
                <div className="text-sm text-slate-400">{lot.spec_value || "-"}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-800">
                  {currentQty}
                  <span className="text-sm font-normal text-slate-400 ml-1">
                    {unit}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 분할 수량 입력 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              분할(사용) 수량
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={splitQuantity}
                onChange={(e) => setSplitQuantity(e.target.value)}
                step="any"
                min="0"
                max={currentQty - 0.0001}
                placeholder="0"
                className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                disabled={isSplitting}
              />
              <span className="text-slate-400 font-medium">{unit}</span>
            </div>
            <div className="mt-2 text-sm text-slate-400">
              최대 {(currentQty - 0.0001).toFixed(4)} {unit} 까지 가능
            </div>
          </div>

          {/* 분할 사유 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              분할 사유
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={isSplitting}
            >
              <option value="order">주문 처리</option>
              <option value="processing">가공/작업</option>
              <option value="sample">샘플 출고</option>
              <option value="transfer">이동/이관</option>
              <option value="other">기타</option>
            </select>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              메모 (선택)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="분할 관련 메모..."
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              disabled={isSplitting}
            />
          </div>

          {/* 분할 결과 미리보기 */}
          {splitQty > 0 && (
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-800 mb-3">
                분할 결과 미리보기
              </div>
              <div className="flex items-center justify-between gap-4">
                {/* 원본 */}
                <div className="flex-1 bg-slate-100 rounded-lg p-3 text-center opacity-50">
                  <Package className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                  <div className="text-xs text-slate-400">원본 (소멸)</div>
                  <div className="font-medium text-slate-400 line-through">
                    {currentQty} {unit}
                  </div>
                </div>

                <ArrowRight className="h-5 w-5 text-orange-500 flex-shrink-0" />

                {/* 분할 결과 */}
                <div className="flex-1 space-y-2">
                  {/* 사용분 */}
                  <div className="bg-orange-100 rounded-lg p-3 text-center">
                    <div className="text-xs text-orange-600">사용분 (새 LOT)</div>
                    <div className="font-bold text-orange-700">
                      {splitQty} {unit}
                    </div>
                  </div>
                  {/* 잔재 */}
                  <div className="bg-green-100 rounded-lg p-3 text-center">
                    <div className="text-xs text-green-600">잔재 (새 LOT)</div>
                    <div className="font-bold text-green-700">
                      {remnantQty.toFixed(4)} {unit}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </form>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSplitting}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!isValid || isSplitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSplitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                분할 중...
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4" />
                분할하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
