"use client";

import { Plane, Ship, Package, Landmark, Truck, DollarSign } from "lucide-react";
import { CustomsCostStats as CustomsCostStatsType } from "@/types/overseas";

interface CustomsCostStatsProps {
  stats: CustomsCostStatsType | null;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("ko-KR").format(value);
};

export default function CustomsCostStats({
  stats,
  isLoading,
}: CustomsCostStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 pt-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse"
          >
            <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
            <div className="h-6 bg-slate-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      label: "총 통관비용",
      value: stats.total_amount,
      subLabel: `(VAT 제외: ${formatCurrency(stats.total_subtotal)})`,
      icon: DollarSign,
      bgColor: "bg-teal-50",
      iconColor: "text-teal-600",
      textColor: "text-teal-600",
    },
    {
      label: "항공/해상료",
      value: stats.total_air_freight + stats.total_sea_freight,
      subLabel: `항공 ${formatCurrency(stats.total_air_freight)} / 해상 ${formatCurrency(stats.total_sea_freight)}`,
      icon: stats.total_air_freight > stats.total_sea_freight ? Plane : Ship,
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
      textColor: "text-indigo-600",
    },
    {
      label: "관세",
      value: stats.total_customs_duty,
      icon: Landmark,
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
      textColor: "text-amber-600",
    },
    {
      label: "기타 비용",
      value:
        stats.total_port_charges +
        stats.total_domestic_transport +
        stats.total_express_freight,
      subLabel: `포트/통관 ${formatCurrency(stats.total_port_charges)} / 내국운송 ${formatCurrency(stats.total_domestic_transport)}`,
      icon: Truck,
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 pt-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;

        return (
          <div
            key={index}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                <p className={`text-lg font-semibold ${card.textColor}`}>
                  {formatCurrency(card.value)}원
                </p>
                {card.subLabel && (
                  <p className="text-xs text-slate-400 mt-1">{card.subLabel}</p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon size={20} className={card.iconColor} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
