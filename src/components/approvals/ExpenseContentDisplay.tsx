"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, CreditCard, Wallet } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";

// 비용 항목 타입
export interface ExpenseItem {
  id?: string;
  amount: number;
  date: string;
  merchant: string;
  category: string;
  paymentMethod?: "personal" | "corporate" | "cash";
  externalAttendees?: string;
  internalAttendees?: string;
  description?: string;
}

// 정산 데이터 타입
export interface ExpenseData {
  items: ExpenseItem[];
  totalAmount?: number;
}

// 결재 카테고리에 따른 필드 구성
const EXPENSE_FIELDS = [
  { key: "amount", label: "정산 금액", type: "currency" },
  { key: "date", label: "사용일", type: "date" },
  { key: "merchant", label: "사용처", type: "text" },
  { key: "category", label: "비용 항목", type: "text" },
  { key: "externalAttendees", label: "외부인", type: "text" },
  { key: "internalAttendees", label: "참석자", type: "text" },
  { key: "description", label: "상세 내용", type: "text" },
] as const;

const PAYMENT_METHOD_LABELS: Record<string, { label: string; icon: typeof CreditCard }> = {
  personal: { label: "개인 카드", icon: CreditCard },
  corporate: { label: "법인 카드", icon: CreditCard },
  cash: { label: "현금", icon: Wallet },
};

interface ExpenseContentDisplayProps {
  content: string;
}

export default function ExpenseContentDisplay({ content }: ExpenseContentDisplayProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));

  // JSON 파싱 시도
  const expenseData = useMemo<ExpenseData | null>(() => {
    if (!content) return null;
    try {
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.items)) {
        return parsed as ExpenseData;
      }
      if (Array.isArray(parsed)) {
        return { items: parsed };
      }
      return null;
    } catch {
      return null;
    }
  }, [content]);

  // 구조화된 데이터가 아니면 일반 HTML로 렌더링
  if (!expenseData || expenseData.items.length === 0) {
    return (
      <div
        className="prose prose-sm max-w-none text-slate-700"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    );
  }

  const items = expenseData.items;
  const totalAmount = expenseData.totalAmount ?? items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedItems(new Set(items.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  const formatValue = (value: unknown, type: string): string => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    switch (type) {
      case "currency":
        return `₩${Number(value).toLocaleString("ko-KR")}`;
      case "date":
        return String(value);
      default:
        return String(value);
    }
  };

  return (
    <div className="space-y-3">
      {/* 내역 아이템들 */}
      {items.map((item, index) => {
        const isExpanded = expandedItems.has(index);
        const paymentInfo = PAYMENT_METHOD_LABELS[item.paymentMethod || "personal"] || PAYMENT_METHOD_LABELS.personal;
        const PaymentIcon = paymentInfo.icon;

        return (
          <div
            key={item.id || index}
            className="border border-slate-200 rounded-lg overflow-hidden"
          >
            {/* 헤더 */}
            <button
              onClick={() => toggleItem(index)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-800">
                  내역 {index + 1}
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-600">
                  <PaymentIcon className="w-3 h-3" />
                  {paymentInfo.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  {formatValue(item.amount, "currency")}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* 상세 내용 */}
            {isExpanded && (
              <div className="divide-y divide-slate-100">
                {EXPENSE_FIELDS.map((field) => {
                  const value = item[field.key as keyof ExpenseItem];
                  return (
                    <div
                      key={field.key}
                      className="flex items-start px-4 py-2.5"
                    >
                      <span className="w-24 flex-shrink-0 text-xs text-slate-500">
                        {field.label}
                      </span>
                      <span className="flex-1 text-sm text-slate-800">
                        {formatValue(value, field.type)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* 합계 및 컨트롤 */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">합계</span>
          <span className="text-xs text-slate-500">
            전체 {items.length}건
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-base font-bold text-blue-600">
            ₩{totalAmount.toLocaleString("ko-KR")}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={expandAll}
              className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              전체 열기
            </button>
            <button
              onClick={collapseAll}
              className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              전체 닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
