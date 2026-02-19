"use client";

import { useRouter } from "next/navigation";
import { Building2, ChevronRight, MessageSquare, FileText, TrendingUp, Crown, Medal, Award } from "lucide-react";

interface ClientAnalysis {
  id: string;
  name: string;
  consultations: number;
  estimates: number;
  orders: number;
  totalSales: number;
  totalPurchases: number;
}

interface TopCompaniesCardProps {
  clientAnalysisData: ClientAnalysis[];
  isLoading?: boolean;
}

const rankStyles = [
  { bg: "bg-amber-100", text: "text-amber-700", icon: Crown, ringColor: "ring-amber-200" },
  { bg: "bg-slate-100", text: "text-slate-600", icon: Medal, ringColor: "ring-slate-200" },
  { bg: "bg-orange-50", text: "text-orange-600", icon: Award, ringColor: "ring-orange-200" },
  { bg: "bg-slate-50", text: "text-slate-500", icon: null, ringColor: "ring-slate-100" },
];

export default function TopCompaniesCard({
  clientAnalysisData,
  isLoading = false,
}: TopCompaniesCardProps) {
  const router = useRouter();

  const topCompanies = [...clientAnalysisData]
    .sort((a, b) => {
      const scoreA = a.consultations * 2 + a.totalSales / 10000000;
      const scoreB = b.consultations * 2 + b.totalSales / 10000000;
      return scoreB - scoreA;
    })
    .slice(0, 4);

  const formatAmount = (amount: number) => {
    if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
    if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
    return amount.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 h-full">
        <div className="flex items-center mb-4">
          <div className="p-1.5 bg-amber-50 rounded-lg mr-2">
            <Building2 className="h-4 w-4 text-amber-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">주요 거래처</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-2.5">
              <div className="h-8 w-8 bg-slate-100 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-slate-100 rounded w-24 mb-1.5" />
                <div className="h-3 bg-slate-100 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (topCompanies.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 h-full">
        <div className="flex items-center mb-4">
          <div className="p-1.5 bg-amber-50 rounded-lg mr-2">
            <Building2 className="h-4 w-4 text-amber-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">주요 거래처</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-32 text-slate-400">
          <Building2 className="h-8 w-8 text-amber-200 mb-2" />
          <p className="text-sm">거래처 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-1.5 bg-amber-50 rounded-lg mr-2">
            <Building2 className="h-4 w-4 text-amber-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">주요 거래처</h2>
        </div>
        <button
          onClick={() => router.push("/reports/customers")}
          className="text-xs text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-0.5 hover:gap-1 transition-all"
        >
          전체보기
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-1.5">
        {topCompanies.map((company, index) => {
          const style = rankStyles[index] || rankStyles[3];
          const RankIcon = style.icon;
          return (
            <div
              key={company.id}
              onClick={() => router.push(`/consultations/${company.id}`)}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-all duration-200 group hover:shadow-sm"
            >
              {/* Rank badge */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${style.bg} ring-1 ${style.ringColor}
                transition-transform group-hover:scale-110
              `}>
                {RankIcon ? (
                  <RankIcon className={`h-4 w-4 ${style.text}`} />
                ) : (
                  <span className={`text-xs font-bold ${style.text}`}>{index + 1}</span>
                )}
              </div>

              {/* Company info */}
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-800 text-sm truncate block group-hover:text-amber-700 transition-colors">
                  {company.name}
                </span>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <span className="flex items-center gap-0.5 text-xs text-slate-400">
                    <MessageSquare className="h-3 w-3" />
                    {company.consultations}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-slate-400">
                    <FileText className="h-3 w-3" />
                    {company.estimates}
                  </span>
                  {company.totalSales > 0 && (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-sky-600">
                      <TrendingUp className="h-3 w-3" />
                      {formatAmount(company.totalSales)}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
