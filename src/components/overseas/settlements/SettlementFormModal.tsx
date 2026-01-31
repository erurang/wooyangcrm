"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Loader2, Calculator, Check, Package } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ImportSettlementFormData, SettleableCustomsCost } from "@/types/settlement";
import { useOverseasCompanies } from "@/hooks/overseas";

interface SettlementFormModalProps {
  mode: "add" | "edit";
  isOpen: boolean;
  onClose: () => void;
  formData: ImportSettlementFormData;
  setFormData: (data: ImportSettlementFormData) => void;
  onSubmit: () => void;
  saving: boolean;
}

export default function SettlementFormModal({
  mode,
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  saving,
}: SettlementFormModalProps) {
  const { companies } = useOverseasCompanies({ limit: 100 });
  const [customsCosts, setCustomsCosts] = useState<SettleableCustomsCost[]>([]);
  const [loadingCosts, setLoadingCosts] = useState(false);

  // 거래처 선택 시 정산 가능한 통관 건 조회
  useEffect(() => {
    const fetchCustomsCosts = async () => {
      if (!formData.company_id) {
        setCustomsCosts([]);
        return;
      }

      setLoadingCosts(true);
      try {
        const res = await fetch(
          `/api/import-settlements/ready?company_id=${formData.company_id}`
        );
        if (res.ok) {
          const data = await res.json();
          setCustomsCosts(data.customs_costs || []);
        }
      } catch (error) {
        console.error("통관 건 목록 조회 실패:", error);
      } finally {
        setLoadingCosts(false);
      }
    };

    fetchCustomsCosts();
  }, [formData.company_id]);

  // 통관 건 선택/해제
  const handleToggleItem = useCallback(
    (cost: SettleableCustomsCost) => {
      const existingIndex = formData.items.findIndex(
        (item) => item.customs_cost_id === cost.customs_cost_id
      );

      if (existingIndex >= 0) {
        // 해제
        setFormData({
          ...formData,
          items: formData.items.filter(
            (item) => item.customs_cost_id !== cost.customs_cost_id
          ),
        });
      } else {
        // 선택
        setFormData({
          ...formData,
          items: [
            ...formData.items,
            {
              customs_cost_id: cost.customs_cost_id,
              consultation_id: cost.consultation_id,
              item_amount: cost.item_amount || 0,
              item_currency: cost.item_currency || "KRW",
            },
          ],
        });
      }
    },
    [formData, setFormData]
  );

  // 전체 선택/해제
  const handleToggleAll = useCallback(() => {
    if (formData.items.length === customsCosts.length) {
      // 전체 해제
      setFormData({ ...formData, items: [] });
    } else {
      // 전체 선택
      setFormData({
        ...formData,
        items: customsCosts.map((cost) => ({
          customs_cost_id: cost.customs_cost_id,
          consultation_id: cost.consultation_id,
          item_amount: cost.item_amount || 0,
          item_currency: cost.item_currency || "KRW",
        })),
      });
    }
  }, [customsCosts, formData, setFormData]);

  // 선택된 건들의 물품가 합계
  const totalItemAmount = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + Number(item.item_amount || 0), 0);
  }, [formData.items]);

  // 환차손/통관료 계산 (실시간)
  const exchangeLossCustoms = useMemo(() => {
    const supply = Number(formData.supply_amount || 0);
    const vat = Number(formData.vat_amount || 0);
    const remittance = Number(formData.remittance_amount || 0);
    return supply + vat - remittance;
  }, [formData.supply_amount, formData.vat_amount, formData.remittance_amount]);

  // 세금계산서 합계
  const taxInvoiceTotal = useMemo(() => {
    return Number(formData.supply_amount || 0) + Number(formData.vat_amount || 0);
  }, [formData.supply_amount, formData.vat_amount]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Calculator size={20} className="text-teal-600" />
              <h2 className="text-lg font-bold text-slate-800">
                {mode === "add" ? "입고정산 등록" : "입고정산 수정"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 본문 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* 거래처 + 정산일 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  거래처 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.company_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      company_id: e.target.value,
                      items: [],
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">선택하세요</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  정산일
                </label>
                <input
                  type="date"
                  value={formData.settlement_date}
                  onChange={(e) =>
                    setFormData({ ...formData, settlement_date: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* 통관 건 선택 */}
            {formData.company_id && (
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-800">
                    정산할 통관 건 선택 <span className="text-red-500">*</span>
                  </h3>
                  {customsCosts.length > 0 && (
                    <button
                      onClick={handleToggleAll}
                      className="text-xs text-teal-600 hover:text-teal-700"
                    >
                      {formData.items.length === customsCosts.length
                        ? "전체 해제"
                        : "전체 선택"}
                    </button>
                  )}
                </div>

                {loadingCosts ? (
                  <div className="flex items-center justify-center py-8 text-slate-400">
                    <Loader2 size={20} className="animate-spin mr-2" />
                    로딩 중...
                  </div>
                ) : customsCosts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                    <p>정산 가능한 통관 건이 없습니다</p>
                    <p className="text-xs mt-1">통관 완료 후 정산할 수 있습니다</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="w-10 px-3 py-2 text-left"></th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">
                            O/C No.
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">
                            품명
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">
                            통관일
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-slate-600">
                            물품가
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {customsCosts.map((cost) => {
                          const isSelected = formData.items.some(
                            (item) => item.customs_cost_id === cost.customs_cost_id
                          );
                          return (
                            <tr
                              key={cost.customs_cost_id}
                              onClick={() => handleToggleItem(cost)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-teal-50"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <td className="px-3 py-2">
                                <div
                                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                                    isSelected
                                      ? "bg-teal-600 border-teal-600"
                                      : "border-slate-300"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check size={14} className="text-white" />
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-slate-800">
                                {cost.oc_number || "-"}
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {cost.product_name || "-"}
                              </td>
                              <td className="px-3 py-2 text-slate-500">
                                {cost.clearance_date || "-"}
                              </td>
                              <td className="px-3 py-2 text-right text-slate-700">
                                {(cost.item_amount || 0).toLocaleString()}
                                <span className="text-slate-400 ml-1 text-xs">
                                  {cost.item_currency || "KRW"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 선택된 건 요약 */}
                {formData.items.length > 0 && (
                  <div className="mt-3 bg-teal-50 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-teal-700">
                      <span className="font-bold">{formData.items.length}건</span> 선택됨
                    </span>
                    <span className="text-sm font-bold text-teal-700">
                      물품가 합계: {totalItemAmount.toLocaleString()}원
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 송금 정보 */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">송금 정보</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    송금일
                  </label>
                  <input
                    type="date"
                    value={formData.remittance_date}
                    onChange={(e) =>
                      setFormData({ ...formData, remittance_date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    송금액 (원화)
                  </label>
                  <input
                    type="number"
                    value={formData.remittance_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, remittance_amount: e.target.value })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    통화
                  </label>
                  <select
                    value={formData.remittance_currency}
                    onChange={(e) =>
                      setFormData({ ...formData, remittance_currency: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="KRW">KRW</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="CNY">CNY</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 세금계산서 정보 */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">세금계산서</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    발행일
                  </label>
                  <input
                    type="date"
                    value={formData.tax_invoice_date}
                    onChange={(e) =>
                      setFormData({ ...formData, tax_invoice_date: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    공급가액
                  </label>
                  <input
                    type="number"
                    value={formData.supply_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, supply_amount: e.target.value })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    부가세
                  </label>
                  <input
                    type="number"
                    value={formData.vat_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, vat_amount: e.target.value })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* 계산 결과 */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">물품가 합계</div>
                  <div className="text-lg font-bold text-slate-800">
                    {totalItemAmount.toLocaleString()}원
                  </div>
                  <div className="text-xs text-slate-400">
                    {formData.items.length}건 선택
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">세금계산서 합계</div>
                  <div className="text-lg font-bold text-slate-800">
                    {taxInvoiceTotal.toLocaleString()}원
                  </div>
                  <div className="text-xs text-slate-400">공급가액 + 부가세</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">환차손 및 통관료</div>
                  <div
                    className={`text-lg font-bold ${
                      exchangeLossCustoms > 0
                        ? "text-red-600"
                        : exchangeLossCustoms < 0
                        ? "text-emerald-600"
                        : "text-slate-800"
                    }`}
                  >
                    {exchangeLossCustoms > 0 ? "+" : ""}
                    {exchangeLossCustoms.toLocaleString()}원
                  </div>
                  <div className="text-xs text-slate-400">
                    세금계산서 합계 - 송금액
                  </div>
                </div>
              </div>
            </div>

            {/* 비고 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                비고
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="메모..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              onClick={onSubmit}
              disabled={saving || formData.items.length === 0 || !formData.company_id}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {mode === "add" ? "등록" : "저장"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
