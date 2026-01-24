"use client";

import { useState, useEffect } from "react";
import { Edit, Trash2, Paperclip, Plane, Ship, Truck, ChevronDown, ChevronUp } from "lucide-react";
import {
  OverseasOrder,
  SHIPPING_METHOD_LABELS,
  CURRENCY_SYMBOLS,
  CurrencyType,
} from "@/types/overseas";
import { supabase } from "@/lib/supabaseClient";
import OverseasOrderFileModal from "./OverseasOrderFileModal";

interface User {
  id: string;
  name: string;
}

interface OverseasOrderCardProps {
  order: OverseasOrder;
  users: User[];
  onEdit: (order: OverseasOrder) => void;
  onDelete: (order: OverseasOrder) => void;
  showCompanyName?: boolean;
}

export default function OverseasOrderCard({
  order,
  users,
  onEdit,
  onDelete,
  showCompanyName = false,
}: OverseasOrderCardProps) {
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [showAllItems, setShowAllItems] = useState(false);

  // 파일 개수 로드
  useEffect(() => {
    const loadFileCount = async () => {
      const { count, error } = await supabase
        .from("overseas_order_files")
        .select("*", { count: "exact", head: true })
        .eq("order_id", order.id);

      if (!error && count !== null) {
        setFileCount(count);
      }
    };

    loadFileCount();
  }, [order.id]);

  // 금액 포맷
  const formatAmount = (amount: number, currency: CurrencyType = "USD") => {
    const symbol = CURRENCY_SYMBOLS[currency] || "$";
    return `${symbol}${amount.toLocaleString()}`;
  };

  // 운송방법 아이콘
  const getShippingIcon = (method?: string) => {
    switch (method) {
      case "air":
        return <Plane size={14} className="text-blue-500" />;
      case "sea":
        return <Ship size={14} className="text-cyan-500" />;
      case "express":
        return <Truck size={14} className="text-orange-500" />;
      default:
        return null;
    }
  };

  // 담당자 정보
  const orderUser = users.find((u) => u.id === order.user_id);

  // 품목 표시 (최대 3개 또는 전체)
  const items = order.items || [];
  const displayItems = showAllItems ? items : items.slice(0, 3);
  const hasMoreItems = items.length > 3;

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
        <div className="flex">
          {/* 좌측: 날짜, 담당자, 운송 정보 */}
          <div className="w-36 shrink-0 bg-slate-50 p-3 border-r border-slate-100 flex flex-col justify-between">
            <div className="space-y-2">
              {/* 발주일 */}
              <div>
                <div className="text-[10px] text-slate-400">발주일</div>
                <div className="text-sm font-medium text-slate-800">
                  {order.order_date}
                </div>
              </div>

              {/* 출고일 / 입고일 */}
              {(order.shipment_date || order.arrival_date) && (
                <div className="text-[10px] space-y-0.5">
                  {order.shipment_date && (
                    <div className="text-slate-500">
                      출고: <span className="text-slate-700">{order.shipment_date}</span>
                    </div>
                  )}
                  {order.arrival_date && (
                    <div className="text-slate-500">
                      입고: <span className="text-slate-700">{order.arrival_date}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 담당자들 */}
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div>
                  <div className="text-[10px] text-slate-400">상대</div>
                  <div className="text-xs text-slate-700 truncate">
                    {order.contact_name || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">담당</div>
                  <div className="text-xs text-teal-600 truncate">
                    {orderUser ? orderUser.name : order.user_name || "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* 운송방법 (하단) */}
            {order.shipping_method && (
              <div className="mt-2 flex items-center gap-1">
                {getShippingIcon(order.shipping_method)}
                <span className="text-[10px] text-slate-600">
                  {SHIPPING_METHOD_LABELS[order.shipping_method]}
                </span>
              </div>
            )}
          </div>

          {/* 중앙+우측: Invoice, 품목+비고, 송금정보 */}
          <div className="flex-1 p-3 flex flex-col min-w-0">
            {/* 헤더: Invoice + 버튼 */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                {showCompanyName && order.company_name && (
                  <div className="text-[11px] text-slate-500 mb-0.5">
                    {order.company_name}
                  </div>
                )}
                <h3 className="font-semibold text-[15px] text-teal-600 truncate">
                  {order.invoice_no}
                </h3>
                <div className="text-xs text-slate-500">
                  총 {formatAmount(order.total_amount, order.currency)}
                  {order.krw_amount && (
                    <span className="ml-1 text-slate-400">
                      (₩{order.krw_amount.toLocaleString()})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(order);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                >
                  <Edit size={13} />
                  수정
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(order);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={13} />
                  삭제
                </button>
              </div>
            </div>

            {/* 콘텐츠 영역: 품목 테이블 (좌) + 비고 (우) 1:1 */}
            <div className="flex gap-3 flex-1 mb-2">
              {/* 품목 테이블 */}
              <div className="flex-1 min-w-0">
                {items.length > 0 ? (
                  <>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100">
                          <th className="text-left py-1 font-normal">품명</th>
                          <th className="text-left py-1 font-normal w-24">규격</th>
                          <th className="text-right py-1 font-normal w-16">수량</th>
                          <th className="text-right py-1 font-normal w-20">단가</th>
                          <th className="text-right py-1 font-normal w-24">금액</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700">
                        {displayItems.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-50">
                            <td className="py-1.5 pr-2 truncate max-w-[150px]" title={item.name}>
                              {item.name || "-"}
                            </td>
                            <td className="py-1.5 text-slate-500 truncate" title={item.spec}>
                              {item.spec || "-"}
                            </td>
                            <td className="py-1.5 text-right">{item.quantity || "-"}</td>
                            <td className="py-1.5 text-right">{item.unit_price?.toLocaleString() || "-"}</td>
                            <td className="py-1.5 text-right font-medium">
                              {formatAmount(item.amount || 0, order.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {hasMoreItems && (
                      <button
                        onClick={() => setShowAllItems(!showAllItems)}
                        className="w-full py-1 text-[10px] text-slate-500 hover:text-teal-600 flex items-center justify-center gap-1"
                      >
                        {showAllItems ? (
                          <>접기 <ChevronUp size={12} /></>
                        ) : (
                          <>+{items.length - 3}개 더보기 <ChevronDown size={12} /></>
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-400 py-2">품목 없음</div>
                )}
              </div>

              {/* 비고 */}
              <div className="flex-1 border-l border-slate-100 pl-3">
                <div className="text-[10px] text-slate-400 mb-1">비고</div>
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
                  {order.notes || <span className="text-slate-400">-</span>}
                </div>
              </div>
            </div>

            {/* 하단: 첨부파일 + 송금정보 */}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-slate-100">
              {/* 첨부파일 버튼 (왼쪽) */}
              <button
                onClick={() => setFileModalOpen(true)}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded border transition-colors ${
                  fileCount > 0
                    ? "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Paperclip size={12} />
                파일
                {fileCount > 0 && (
                  <span className="ml-0.5 bg-teal-600 text-white text-[9px] px-1 py-0.5 rounded-full">
                    {fileCount}
                  </span>
                )}
              </button>

              {/* 송금 정보 (오른쪽) */}
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                {order.remittance_amount ? (
                  <span>
                    송금: {formatAmount(order.remittance_amount, order.currency)}
                    {order.remittance_date && ` (${order.remittance_date})`}
                  </span>
                ) : null}
                {order.exchange_rate ? (
                  <span>환율: ₩{order.exchange_rate.toLocaleString()}</span>
                ) : null}
                {!order.remittance_amount && !order.exchange_rate && (
                  <span className="text-slate-400">송금 정보 없음</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 파일 첨부 모달 */}
      <OverseasOrderFileModal
        isOpen={fileModalOpen}
        onClose={() => setFileModalOpen(false)}
        orderId={order.id}
        invoiceNo={order.invoice_no}
        onFileCountChange={setFileCount}
      />
    </>
  );
}
