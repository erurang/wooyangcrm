"use client";

import { useState } from "react";
import { Edit, Trash2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import {
  OverseasConsultation,
  ORDER_TYPE_LABELS,
  CURRENCY_LABELS,
  SHIPPING_METHOD_LABELS,
  TRADE_STATUS_LABELS,
  TRADE_STATUS_COLORS,
  TradeStatus,
} from "@/types/overseas";

interface User {
  id: string;
  name: string;
}

interface OverseasConsultationSpreadsheetProps {
  consultations: OverseasConsultation[];
  users: User[];
  loginUserId: string;
  isLoading?: boolean;
  onEditConsultation: (consultation: OverseasConsultation) => void;
  onDeleteConsultation: (consultation: OverseasConsultation) => void;
  onAddConsultation?: () => void;
}

// 날짜 포맷 (YYYY-MM-DD -> MM/DD)
const formatDateShort = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
};

// 날짜 포맷 (YYYY-MM-DD -> YYYY.MM.DD)
const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// 금액 포맷
const formatCurrency = (amount?: number, currency?: string) => {
  if (!amount) return "-";
  const formatted = amount.toLocaleString("ko-KR");
  if (currency) {
    const symbols: Record<string, string> = {
      KRW: "₩",
      USD: "$",
      EUR: "€",
      CNY: "¥",
      JPY: "¥",
      GBP: "£",
    };
    return `${symbols[currency] || ""}${formatted}`;
  }
  return formatted;
};

// 정렬 방향
type SortDirection = "asc" | "desc" | null;

// 정렬 가능한 필드
type SortField =
  | "date"
  | "order_type"
  | "order_date"
  | "pickup_date"
  | "arrival_date"
  | "total_remittance"
  | "remittance_date";

export default function OverseasConsultationSpreadsheet({
  consultations,
  users,
  loginUserId,
  isLoading,
  onEditConsultation,
  onDeleteConsultation,
  onAddConsultation,
}: OverseasConsultationSpreadsheetProps) {
  // 정렬 상태
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 정렬된 상담 목록
  const sortedConsultations = [...consultations].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    let aValue: string | number | null = null;
    let bValue: string | number | null = null;

    switch (sortField) {
      case "date":
        aValue = a.date;
        bValue = b.date;
        break;
      case "order_type":
        aValue = a.order_type || "";
        bValue = b.order_type || "";
        break;
      case "order_date":
        aValue = a.order_date || "";
        bValue = b.order_date || "";
        break;
      case "pickup_date":
        aValue = a.pickup_date || "";
        bValue = b.pickup_date || "";
        break;
      case "arrival_date":
        aValue = a.arrival_date || "";
        bValue = b.arrival_date || "";
        break;
      case "total_remittance":
        aValue = a.total_remittance || 0;
        bValue = b.total_remittance || 0;
        break;
      case "remittance_date":
        aValue = a.remittance_date || "";
        bValue = b.remittance_date || "";
        break;
    }

    if (aValue === null || bValue === null) return 0;
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // 정렬 아이콘
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronDown size={12} className="text-slate-300" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp size={12} className="text-teal-600" />
    ) : (
      <ChevronDown size={12} className="text-teal-600" />
    );
  };

  // 정렬 가능한 헤더 셀
  const SortableHeader = ({
    field,
    children,
    className = "",
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={`px-2 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap cursor-pointer hover:bg-slate-100 select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <SortIcon field={field} />
      </div>
    </th>
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 mt-3">상담 내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!consultations || consultations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-12 text-center">
        <FileText size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">등록된 상담이 없습니다.</p>
        {onAddConsultation && (
          <button
            onClick={onAddConsultation}
            className="mt-4 text-teal-600 hover:text-teal-700 text-sm"
          >
            첫 상담 등록하기
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 스크롤 가능한 테이블 래퍼 */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1600px] text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-2 py-2 text-center text-xs font-medium text-slate-600 whitespace-nowrap w-10 sticky left-0 bg-slate-50 z-10">
                #
              </th>
              <SortableHeader field="order_type">
                수입/수출
              </SortableHeader>
              <SortableHeader field="date">상담일</SortableHeader>
              <th className="px-2 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap">
                담당자
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap">
                작성자
              </th>
              <SortableHeader field="order_date">발주일</SortableHeader>
              <th className="px-2 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap">
                생산예정
              </th>
              <SortableHeader field="pickup_date">출고일</SortableHeader>
              <SortableHeader field="arrival_date">입고일</SortableHeader>
              <th className="px-2 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap">
                O/C No.
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap">
                통화
              </th>
              <SortableHeader field="total_remittance">총송금액</SortableHeader>
              <SortableHeader field="remittance_date">송금일</SortableHeader>
              <th className="px-2 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap">
                운송
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap">
                운송업체
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-slate-600 whitespace-nowrap">
                상태
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-slate-600 whitespace-nowrap max-w-[200px]">
                비고
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-slate-600 whitespace-nowrap sticky right-0 bg-slate-50 z-10">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedConsultations.map((consultation, index) => {
              const consultUser = users.find((u) => u.id === consultation.user_id);
              const isAuthor = loginUserId === consultation.user_id;

              return (
                <tr
                  key={consultation.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => onEditConsultation(consultation)}
                >
                  {/* 순번 */}
                  <td className="px-2 py-2.5 text-center text-xs text-slate-500 font-medium whitespace-nowrap w-10 sticky left-0 bg-white z-10">
                    {index + 1}
                  </td>
                  {/* 수입/수출 */}
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    {consultation.order_type ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          consultation.order_type === "import"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {ORDER_TYPE_LABELS[consultation.order_type]}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* 상담일 */}
                  <td className="px-2 py-2.5 whitespace-nowrap text-slate-700">
                    {formatDate(consultation.date)}
                  </td>

                  {/* 거래처 담당자 */}
                  <td className="px-2 py-2.5 whitespace-nowrap text-slate-700">
                    {consultation.contact_name || "-"}
                  </td>

                  {/* 작성자 */}
                  <td className="px-2 py-2.5 whitespace-nowrap text-slate-700">
                    {consultUser?.name || "-"}
                  </td>

                  {/* 발주일 */}
                  <td className="px-2 py-2.5 whitespace-nowrap text-slate-700">
                    {formatDateShort(consultation.order_date)}
                  </td>

                  {/* 생산완료예정일 */}
                  <td className="px-2 py-2.5 whitespace-nowrap text-slate-700">
                    {formatDateShort(consultation.expected_completion_date)}
                  </td>

                  {/* 출고일 */}
                  <td className="px-2 py-2.5 whitespace-nowrap text-slate-700">
                    {formatDateShort(consultation.pickup_date)}
                  </td>

                  {/* 입고일 */}
                  <td className="px-2 py-2.5 whitespace-nowrap text-slate-700">
                    {formatDateShort(consultation.arrival_date)}
                  </td>

                  {/* O/C No. */}
                  <td className="px-2 py-2.5 whitespace-nowrap text-slate-700 font-mono text-xs">
                    {consultation.oc_number || "-"}
                  </td>

                  {/* 통화 */}
                  <td className="px-2 py-2.5 whitespace-nowrap text-slate-700">
                    {consultation.currency || "-"}
                  </td>

                  {/* 총송금액 */}
                  <td className="px-2 py-2.5 whitespace-nowrap text-slate-700 text-right font-mono">
                    {formatCurrency(consultation.total_remittance, consultation.currency)}
                  </td>

                  {/* 송금일 */}
                  <td className="px-2 py-2.5 whitespace-nowrap text-slate-700">
                    {formatDateShort(consultation.remittance_date)}
                  </td>

                  {/* 운송 */}
                  <td className="px-2 py-2.5 whitespace-nowrap text-slate-700">
                    {consultation.shipping_method
                      ? SHIPPING_METHOD_LABELS[consultation.shipping_method]
                      : "-"}
                  </td>

                  {/* 운송업체 */}
                  <td className="px-2 py-2.5 whitespace-nowrap text-slate-700">
                    {consultation.shipping_carrier?.name || "-"}
                  </td>

                  {/* 상태 */}
                  <td className="px-2 py-2.5 whitespace-nowrap text-center">
                    {consultation.trade_status ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          TRADE_STATUS_COLORS[consultation.trade_status as TradeStatus]
                        }`}
                      >
                        {TRADE_STATUS_LABELS[consultation.trade_status as TradeStatus]}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">미지정</span>
                    )}
                  </td>

                  {/* 비고 */}
                  <td className="px-2 py-2.5 text-slate-600 max-w-[200px]">
                    <div className="truncate" title={consultation.remarks || ""}>
                      {consultation.remarks || "-"}
                    </div>
                  </td>

                  {/* 관리 버튼 */}
                  <td
                    className="px-2 py-2.5 sticky right-0 bg-white z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEditConsultation(consultation)}
                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Edit size={14} />
                      </button>
                      {isAuthor && (
                        <button
                          onClick={() => onDeleteConsultation(consultation)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 하단 요약 */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <span className="text-sm text-slate-500">
          총 <span className="font-semibold text-teal-600">{consultations.length}</span>건
        </span>
        {onAddConsultation && (
          <button
            onClick={onAddConsultation}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            + 상담 등록
          </button>
        )}
      </div>
    </div>
  );
}
