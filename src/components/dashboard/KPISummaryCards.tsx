"use client";

import { useRouter } from "next/navigation";
import { MessageSquare, FileText, TrendingUp, TrendingDown, Bell, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, ChevronRight } from "lucide-react";

interface KPISummaryCardsProps {
  todayConsultations: number;
  pendingDocuments: number;
  monthSales: number;
  previousMonthSales: number;
  monthPurchases: number;
  previousMonthPurchases: number;
  followUpNeeded: number;
  expiringDocuments: number;
  isLoading?: boolean;
  compact?: boolean;
}

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
  monthPurchases,
  previousMonthPurchases,
  followUpNeeded,
  expiringDocuments,
  isLoading = false,
  compact = false,
}: KPISummaryCardsProps) {
  const router = useRouter();

  const salesChange = calculateChange(monthSales, previousMonthSales);
  const purchaseChange = calculateChange(monthPurchases, previousMonthPurchases);

  const cards = [
    {
      title: "오늘 상담",
      value: todayConsultations,
      suffix: "건",
      icon: MessageSquare,
      gradient: "from-sky-500/10 to-sky-600/5",
      iconBg: "bg-sky-100",
      iconColor: "text-sky-600",
      valueColor: "text-sky-700",
      borderAccent: "border-l-sky-500",
      href: "/consultations/recent",
    },
    {
      title: "진행중 문서",
      value: pendingDocuments,
      suffix: "건",
      icon: FileText,
      gradient: "from-indigo-500/10 to-indigo-600/5",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      valueColor: "text-indigo-700",
      borderAccent: "border-l-indigo-500",
      href: "/documents/review?reviewStatus=pending",
    },
    {
      title: "이번달 매출",
      value: monthSales,
      suffix: "",
      format: "currency",
      icon: TrendingUp,
      gradient: "from-emerald-500/10 to-emerald-600/5",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-700",
      borderAccent: "border-l-emerald-500",
      href: "/reports",
      change: salesChange,
      showChange: true,
    },
    {
      title: "이번달 매입",
      value: monthPurchases,
      suffix: "",
      format: "currency",
      icon: TrendingDown,
      gradient: "from-purple-500/10 to-purple-600/5",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      valueColor: "text-purple-700",
      borderAccent: "border-l-purple-500",
      href: "/reports",
      change: purchaseChange,
      showChange: true,
      invertChange: true,
    },
    {
      title: "팔로우업",
      value: followUpNeeded,
      suffix: "건",
      icon: Bell,
      gradient: followUpNeeded > 0 ? "from-orange-500/10 to-orange-600/5" : "from-slate-500/5 to-slate-600/5",
      iconBg: followUpNeeded > 0 ? "bg-orange-100" : "bg-slate-100",
      iconColor: followUpNeeded > 0 ? "text-orange-600" : "text-slate-400",
      valueColor: followUpNeeded > 0 ? "text-orange-700" : "text-slate-600",
      borderAccent: followUpNeeded > 0 ? "border-l-orange-500" : "border-l-slate-300",
      highlight: followUpNeeded > 0,
      href: "/consultations/follow",
    },
    {
      title: "만료 임박",
      value: expiringDocuments,
      suffix: "건",
      icon: AlertTriangle,
      gradient: expiringDocuments > 0 ? "from-red-500/10 to-red-600/5" : "from-slate-500/5 to-slate-600/5",
      iconBg: expiringDocuments > 0 ? "bg-red-100" : "bg-slate-100",
      iconColor: expiringDocuments > 0 ? "text-red-600" : "text-slate-400",
      valueColor: expiringDocuments > 0 ? "text-red-700" : "text-slate-600",
      borderAccent: expiringDocuments > 0 ? "border-l-red-500" : "border-l-slate-300",
      highlight: expiringDocuments > 0,
      href: "/documents/review?reviewStatus=expired",
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
    if (compact) {
      return (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-slate-50 rounded-lg px-3 py-1.5 animate-pulse flex items-center gap-2"
            >
              <div className="h-3 bg-slate-200 rounded w-12" />
              <div className="h-4 bg-slate-200 rounded w-8" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200/60 p-4 animate-pulse"
          >
            <div className="h-4 bg-slate-100 rounded w-20 mb-3" />
            <div className="h-8 bg-slate-100 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  // Compact mode: inline badges
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              onClick={() => card.href && router.push(card.href)}
              className={`
                group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer
                bg-gradient-to-r ${card.gradient}
                border border-slate-200/60
                transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                hover:border-slate-300/80
              `}
            >
              <Icon className={`h-3.5 w-3.5 ${card.iconColor}`} />
              <span className="text-xs font-medium text-slate-500">{card.title}</span>
              <span className={`text-sm font-bold ${card.valueColor} tabular-nums`}>
                {formatValue(card.value, card.format)}{card.suffix}
              </span>
              {card.showChange && card.change !== undefined && (
                <span className={`text-[10px] font-semibold ${
                  card.change > 0 ? "text-emerald-600" : card.change < 0 ? "text-red-500" : "text-slate-400"
                }`}>
                  {card.change > 0 ? (
                    <ArrowUpRight className="h-3 w-3 inline" />
                  ) : card.change < 0 ? (
                    <ArrowDownRight className="h-3 w-3 inline" />
                  ) : null}
                </span>
              )}
              <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            onClick={() => card.href && router.push(card.href)}
            className={`
              relative overflow-hidden bg-gradient-to-br ${card.gradient}
              rounded-xl border border-slate-200/60 border-l-[3px] ${card.borderAccent}
              p-4 cursor-pointer group
              transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5
              ${card.highlight ? "ring-1 ring-orange-200/50" : ""}
            `}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`${card.iconBg} p-1.5 rounded-lg transition-transform group-hover:scale-110`}>
                <Icon className={`h-3.5 w-3.5 ${card.iconColor}`} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-extrabold ${card.valueColor} tabular-nums tracking-tight`}>
                {formatValue(card.value, card.format)}
              </span>
              {card.suffix && (
                <span className="text-xs font-medium text-slate-400">{card.suffix}</span>
              )}
            </div>
            {card.showChange && card.change !== undefined && (
              <div className={`flex items-center mt-1.5 text-xs font-medium ${
                card.change > 0 ? "text-emerald-600" : card.change < 0 ? "text-red-500" : "text-slate-400"
              }`}>
                {card.change > 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                ) : card.change < 0 ? (
                  <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                ) : (
                  <Minus className="h-3.5 w-3.5 mr-0.5" />
                )}
                <span className="tabular-nums">
                  {card.change > 0 ? "+" : ""}{Math.abs(card.change).toFixed(1)}%
                </span>
                <span className="text-slate-400 ml-1">전월비</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
