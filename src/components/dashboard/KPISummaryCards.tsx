"use client";

import { useRouter } from "next/navigation";
import { MessageSquare, FileText, TrendingUp, Bell, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface KPISummaryCardsProps {
  todayConsultations: number;
  pendingDocuments: number;
  monthSales: number;
  previousMonthSales: number;
  followUpNeeded: number;
  expiringDocuments: number;
  isLoading?: boolean;
}

// 전월 대비 변화율 계산
function calculateChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

export default function KPISummaryCards({
  todayConsultations,
  pendingDocuments,
  monthSales,
  previousMonthSales,
  followUpNeeded,
  expiringDocuments,
  isLoading = false,
}: KPISummaryCardsProps) {
  const router = useRouter();

  // 매출 변화율 계산
  const salesChange = calculateChange(monthSales, previousMonthSales);

  const cards = [
    {
      title: "오늘 상담",
      value: todayConsultations,
      suffix: "건",
      icon: MessageSquare,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      valueColor: "text-blue-700",
      href: "/consultations/recent",
    },
    {
      title: "진행중 문서",
      value: pendingDocuments,
      suffix: "건",
      icon: FileText,
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      valueColor: "text-indigo-700",
      href: "/documents",
    },
    {
      title: "이번달 매출",
      value: monthSales,
      suffix: "",
      format: "currency",
      icon: TrendingUp,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      valueColor: "text-green-700",
      href: "/reports",
      change: salesChange,
      showChange: true,
    },
    {
      title: "팔로우업 필요",
      value: followUpNeeded,
      suffix: "건",
      icon: Bell,
      bgColor: followUpNeeded > 0 ? "bg-orange-50" : "bg-slate-50",
      iconColor: followUpNeeded > 0 ? "text-orange-600" : "text-slate-400",
      valueColor: followUpNeeded > 0 ? "text-orange-700" : "text-slate-600",
      highlight: followUpNeeded > 0,
      href: "/consultations/follow",
    },
    {
      title: "만료 임박 견적",
      value: expiringDocuments,
      suffix: "건",
      icon: AlertTriangle,
      bgColor: expiringDocuments > 0 ? "bg-red-50" : "bg-slate-50",
      iconColor: expiringDocuments > 0 ? "text-red-600" : "text-slate-400",
      valueColor: expiringDocuments > 0 ? "text-red-700" : "text-slate-600",
      highlight: expiringDocuments > 0,
      href: "/documents?filter=expiring",
    },
  ];

  const formatValue = (value: number, format?: string) => {
    if (format === "currency") {
      if (value >= 100000000) {
        return `${(value / 100000000).toFixed(1)}억`;
      }
      if (value >= 10000) {
        return `${(value / 10000).toFixed(0)}만`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse"
          >
            <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-slate-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            onClick={() => card.href && router.push(card.href)}
            className={`
              bg-white rounded-lg border shadow-sm p-4 cursor-pointer
              ${card.highlight ? "border-orange-200 ring-1 ring-orange-100" : "border-slate-200"}
              transition-all hover:shadow-md hover:scale-[1.02]
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {card.title}
              </span>
              <div className={`${card.bgColor} p-1.5 rounded-md`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className={`text-2xl font-bold ${card.valueColor}`}>
                {formatValue(card.value, card.format)}
              </span>
              {card.suffix && (
                <span className="ml-1 text-sm text-slate-500">{card.suffix}</span>
              )}
            </div>
            {card.showChange && card.change !== undefined && (
              <div className={`flex items-center mt-1 text-xs ${
                card.change > 0 ? "text-green-600" : card.change < 0 ? "text-red-600" : "text-slate-500"
              }`}>
                {card.change > 0 ? (
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />
                ) : card.change < 0 ? (
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                ) : (
                  <Minus className="h-3 w-3 mr-0.5" />
                )}
                <span>
                  {card.change > 0 ? "+" : ""}{Math.abs(card.change).toFixed(1)}% 전월 대비
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
