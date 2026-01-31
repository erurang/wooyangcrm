"use client";

import { Edit2, Trash2, CheckCircle, Clock, Package } from "lucide-react";
import { ImportSettlement } from "@/types/settlement";

interface SettlementTableProps {
  settlements: ImportSettlement[];
  isLoading: boolean;
  onEdit: (settlement: ImportSettlement) => void;
  onSettle: (settlementId: string) => void;
  onDelete: (settlementId: string) => void;
}

export default function SettlementTable({
  settlements,
  isLoading,
  onEdit,
  onSettle,
  onDelete,
}: SettlementTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-slate-500">정산 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-500">등록된 정산이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">정산번호</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">거래처</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">포함 건수</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">물품가 합계</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">송금액</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">세금계산서</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">환차손/통관료</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">상태</th>
              <th className="px-4 py-3 text-center font-medium text-slate-600">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {settlements.map((settlement) => (
              <tr key={settlement.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">
                    {settlement.settlement_number || "-"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {settlement.settlement_date || ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">
                    {settlement.company?.name || "-"}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                    <Package size={12} />
                    {settlement.item_count || 0}건
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="font-medium text-slate-800">
                    {(settlement.total_item_amount || 0).toLocaleString()}원
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="font-medium text-slate-800">
                    {settlement.remittance_amount?.toLocaleString() || 0}원
                  </div>
                  <div className="text-xs text-slate-400">
                    {settlement.remittance_date || ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-slate-700">
                    {settlement.tax_invoice_date || "-"}
                  </div>
                  <div className="text-xs text-slate-400">
                    공급가 {(settlement.supply_amount || 0).toLocaleString()} + 부가세 {(settlement.vat_amount || 0).toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`font-medium ${
                      settlement.exchange_loss_customs > 0
                        ? "text-red-600"
                        : settlement.exchange_loss_customs < 0
                        ? "text-emerald-600"
                        : "text-slate-600"
                    }`}
                  >
                    {settlement.exchange_loss_customs > 0 ? "+" : ""}
                    {settlement.exchange_loss_customs?.toLocaleString() || 0}원
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {settlement.status === "settled" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">
                      <CheckCircle size={12} />
                      완료
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-full">
                      <Clock size={12} />
                      대기
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(settlement)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                      title="수정"
                    >
                      <Edit2 size={16} />
                    </button>
                    {settlement.status === "pending" && (
                      <button
                        onClick={() => onSettle(settlement.id)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title="정산 완료"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(settlement.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
