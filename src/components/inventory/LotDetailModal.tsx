"use client";

import { useState } from "react";
import {
  X,
  Package,
  Hash,
  MapPin,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  Edit3,
  History,
  GitBranch,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Save,
} from "lucide-react";
import type { InventoryLotWithDetails, LotStatus } from "@/types/inventory";
import {
  LOT_STATUS_LABELS,
  LOT_STATUS_COLORS,
  LOT_SOURCE_LABELS,
  LOT_TRANSACTION_LABELS,
} from "@/types/inventory";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useLotTransactions, useLotSplitHistory, useLotMutations } from "@/hooks/inventory/useLots";
import { useLoginUser } from "@/context/login";
import dayjs from "dayjs";

interface LotDetailModalProps {
  lot: InventoryLotWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

type TabType = "info" | "transactions" | "splits";

export default function LotDetailModal({
  lot,
  isOpen,
  onClose,
  onUpdate,
}: LotDetailModalProps) {
  const loginUser = useLoginUser();
  const { updateLot, isUpdating } = useLotMutations();

  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [isEditing, setIsEditing] = useState(false);

  // 편집 상태
  const [editLocation, setEditLocation] = useState(lot.location || "");
  const [editNotes, setEditNotes] = useState(lot.notes || "");

  // 트랜잭션 & 분할 이력
  const { transactions, isLoading: transLoading } = useLotTransactions(
    activeTab === "transactions" ? lot.id : null
  );
  const { splitFrom, splitTo, isLoading: splitLoading } = useLotSplitHistory(
    activeTab === "splits" ? lot.id : null
  );

  // ESC 키로 모달 닫기
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;

  const unit = lot.unit || lot.product?.unit || "개";

  const handleSave = async () => {
    const result = await updateLot(lot.id, {
      location: editLocation || null,
      notes: editNotes || null,
      user_id: loginUser?.id,
    });

    if (result.success) {
      setIsEditing(false);
      onUpdate();
    } else {
      alert(result.error || "수정 중 오류가 발생했습니다.");
    }
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: "info", label: "기본 정보", icon: <Package className="h-4 w-4" /> },
    { key: "transactions", label: "변동 이력", icon: <History className="h-4 w-4" /> },
    { key: "splits", label: "분할 이력", icon: <GitBranch className="h-4 w-4" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-sky-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-100">
              <Hash className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-800">{lot.lot_number}</h3>
              <p className="text-sm text-slate-400">
                {lot.product?.internal_name || "제품 미연결"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                LOT_STATUS_COLORS[lot.status as LotStatus]
              }`}
            >
              {LOT_STATUS_LABELS[lot.status as LotStatus]}
            </span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-sky-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b bg-slate-50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-sky-600 text-sky-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-auto p-6">
          {/* 기본 정보 탭 */}
          {activeTab === "info" && (
            <div className="space-y-6">
              {/* 수량 정보 */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400">현재 수량</div>
                    <div className="text-3xl font-bold text-slate-800">
                      {lot.current_quantity}
                      <span className="text-lg font-normal text-slate-400 ml-2">
                        {unit}
                      </span>
                    </div>
                  </div>
                  {lot.initial_quantity !== lot.current_quantity && (
                    <div className="text-right">
                      <div className="text-sm text-slate-400">최초 수량</div>
                      <div className="text-lg text-slate-500">
                        {lot.initial_quantity} {unit}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 상세 정보 그리드 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 제품 정보 */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Package className="h-4 w-4" />
                    제품
                  </div>
                  <div className="font-medium text-slate-800">
                    {lot.product?.internal_name || "-"}
                  </div>
                  {lot.product?.internal_code && (
                    <div className="text-sm text-slate-400">
                      코드: {lot.product.internal_code}
                    </div>
                  )}
                </div>

                {/* 규격 */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <FileText className="h-4 w-4" />
                    규격
                  </div>
                  <div className="font-medium text-slate-800">
                    {lot.spec_value || "-"}
                  </div>
                </div>

                {/* 출처 */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <ArrowDownLeft className="h-4 w-4" />
                    출처
                  </div>
                  <div className="font-medium text-slate-800">
                    {LOT_SOURCE_LABELS[lot.source_type as keyof typeof LOT_SOURCE_LABELS] ||
                      lot.source_type}
                  </div>
                  {lot.source_lot && (
                    <div className="text-sm text-sky-600">
                      원본: {lot.source_lot.lot_number}
                    </div>
                  )}
                </div>

                {/* 공급처 */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Building2 className="h-4 w-4" />
                    공급처
                  </div>
                  <div className="font-medium text-slate-800">
                    {lot.supplier_company?.name || "-"}
                  </div>
                </div>

                {/* 입고일 */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="h-4 w-4" />
                    입고일
                  </div>
                  <div className="font-medium text-slate-800">
                    {lot.received_at
                      ? dayjs(lot.received_at).format("YYYY-MM-DD")
                      : "-"}
                  </div>
                </div>

                {/* 유효기한 */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="h-4 w-4" />
                    유효기한
                  </div>
                  <div className="font-medium text-slate-800">
                    {lot.expiry_date
                      ? dayjs(lot.expiry_date).format("YYYY-MM-DD")
                      : "-"}
                  </div>
                </div>

                {/* 단가 */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <DollarSign className="h-4 w-4" />
                    단가
                  </div>
                  <div className="font-medium text-slate-800">
                    {lot.unit_cost
                      ? `${lot.unit_cost.toLocaleString()}원`
                      : "-"}
                  </div>
                </div>

                {/* 총비용 */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <DollarSign className="h-4 w-4" />
                    총비용
                  </div>
                  <div className="font-medium text-slate-800">
                    {lot.total_cost
                      ? `${lot.total_cost.toLocaleString()}원`
                      : "-"}
                  </div>
                </div>
              </div>

              {/* 위치 (편집 가능) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="h-4 w-4" />
                    위치
                  </div>
                  {!isEditing && lot.status === "available" && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-sky-600 hover:text-sky-800 flex items-center gap-1"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      수정
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="위치 입력 (예: 창고A-선반1)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                ) : (
                  <div className="font-medium text-slate-800">
                    {lot.location || "-"}
                  </div>
                )}
              </div>

              {/* 메모 (편집 가능) */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <FileText className="h-4 w-4" />
                  메모
                </div>
                {isEditing ? (
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="메모..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                  />
                ) : (
                  <div className="text-slate-800 whitespace-pre-wrap">
                    {lot.notes || "-"}
                  </div>
                )}
              </div>

              {/* 편집 버튼 */}
              {isEditing && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditLocation(lot.location || "");
                      setEditNotes(lot.notes || "");
                    }}
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        저장
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 변동 이력 탭 */}
          {activeTab === "transactions" && (
            <div className="space-y-4">
              {transLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  변동 이력이 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          tx.quantity >= 0
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {tx.quantity >= 0 ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800">
                            {LOT_TRANSACTION_LABELS[
                              tx.transaction_type as keyof typeof LOT_TRANSACTION_LABELS
                            ] || tx.transaction_type}
                          </span>
                          <span
                            className={`font-bold ${
                              tx.quantity >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {tx.quantity >= 0 ? "+" : ""}
                            {tx.quantity} {unit}
                          </span>
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                          {tx.quantity_before} → {tx.quantity_after} {unit}
                        </div>
                        {tx.notes && (
                          <div className="text-sm text-slate-500 mt-1">
                            {tx.notes}
                          </div>
                        )}
                        <div className="text-xs text-slate-400 mt-1">
                          {dayjs(tx.created_at).format("YYYY-MM-DD HH:mm")}
                          {tx.creator && ` | ${tx.creator.name}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 분할 이력 탭 */}
          {activeTab === "splits" && (
            <div className="space-y-6">
              {splitLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <>
                  {/* 이 LOT의 출처 (분할로 생성된 경우) */}
                  {splitTo.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-600 mb-3">
                        분할 원본 (이 LOT가 분할로 생성됨)
                      </h4>
                      <div className="space-y-2">
                        {splitTo.map((split: any) => (
                          <div
                            key={split.id}
                            className="p-3 bg-sky-50 rounded-lg border border-sky-200"
                          >
                            <div className="flex items-center gap-2 text-sm">
                              <GitBranch className="h-4 w-4 text-sky-600" />
                              <span className="font-medium text-sky-800">
                                {split.source_lot?.lot_number}
                              </span>
                              <span className="text-sky-600">에서 분할됨</span>
                            </div>
                            <div className="text-xs text-sky-600 mt-1">
                              {dayjs(split.split_at).format("YYYY-MM-DD HH:mm")}
                              {split.splitter && ` | ${split.splitter.name}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 이 LOT에서 분할된 기록 */}
                  {splitFrom.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-600 mb-3">
                        분할 기록 (이 LOT에서 분할됨)
                      </h4>
                      <div className="space-y-3">
                        {splitFrom.map((split: any) => (
                          <div
                            key={split.id}
                            className="p-3 bg-orange-50 rounded-lg border border-orange-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-orange-800">
                                {split.split_quantity} {unit} 분할
                              </span>
                              <span className="text-xs text-orange-600">
                                {dayjs(split.split_at).format("YYYY-MM-DD HH:mm")}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="p-2 bg-orange-100 rounded">
                                <div className="text-xs text-orange-600">사용분</div>
                                <div className="font-medium text-orange-800">
                                  {split.output_lot?.lot_number}
                                </div>
                                <div className="text-xs text-orange-600">
                                  {split.output_lot?.current_quantity} {unit}
                                </div>
                              </div>
                              <div className="p-2 bg-green-100 rounded">
                                <div className="text-xs text-green-600">잔재</div>
                                <div className="font-medium text-green-800">
                                  {split.remnant_lot?.lot_number}
                                </div>
                                <div className="text-xs text-green-600">
                                  {split.remnant_lot?.current_quantity} {unit}
                                </div>
                              </div>
                            </div>
                            {split.notes && (
                              <div className="text-sm text-orange-700 mt-2">
                                {split.notes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {splitFrom.length === 0 && splitTo.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      분할 이력이 없습니다.
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
