"use client";

import { useRouter } from "next/navigation";
import { Building2, ChevronRight, MessageSquare, FileText, TrendingUp } from "lucide-react";

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

export default function TopCompaniesCard({
  clientAnalysisData,
  isLoading = false,
}: TopCompaniesCardProps) {
  const router = useRouter();

  // Sort by consultations + totalSales (weighted ranking)
  const topCompanies = [...clientAnalysisData]
    .sort((a, b) => {
      // Weight: consultations * 1 + totalSales (normalized)
      const scoreA = a.consultations * 2 + a.totalSales / 10000000;
      const scoreB = b.consultations * 2 + b.totalSales / 10000000;
      return scoreB - scoreA;
    })
    .slice(0, 4);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center mb-3">
          <Building2 className="h-4 w-4 text-amber-600 mr-2" />
          <h2 className="text-sm font-semibold text-slate-800">주요 거래처</h2>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-2">
              <div className="h-6 w-6 bg-slate-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-slate-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (topCompanies.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div className="flex items-center mb-3">
          <Building2 className="h-4 w-4 text-amber-600 mr-2" />
          <h2 className="text-sm font-semibold text-slate-800">주요 거래처</h2>
        </div>
        <div className="flex flex-col items-center justify-center h-32 text-slate-500">
          <Building2 className="h-6 w-6 text-amber-300 mb-2" />
          <p className="text-sm">거래처 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  const formatAmount = (amount: number) => {
    if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`;
    if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만`;
    return amount.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Building2 className="h-4 w-4 text-amber-600 mr-2" />
          <h2 className="text-sm font-semibold text-slate-800">주요 거래처</h2>
        </div>
        <button
          onClick={() => router.push("/reports/customers")}
          className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center"
        >
          전체보기
          <ChevronRight className="h-3 w-3 ml-0.5" />
        </button>
      </div>

      <div className="space-y-1">
        {topCompanies.map((company, index) => (
          <div
            key={company.id}
            onClick={() => router.push(`/consultations/${company.id}`)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
          >
            {/* Rank badge */}
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${index === 0 ? "bg-amber-100 text-amber-700" :
                index === 1 ? "bg-slate-200 text-slate-600" :
                index === 2 ? "bg-orange-100 text-orange-700" :
                "bg-slate-100 text-slate-500"}
            `}>
              {index + 1}
            </div>

            {/* Company info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-800 text-sm truncate group-hover:text-amber-700 transition-colors">
                  {company.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-0.5">
                  <MessageSquare className="h-3 w-3" />
                  {company.consultations}건
                </span>
                <span className="flex items-center gap-0.5">
                  <FileText className="h-3 w-3" />
                  {company.estimates}건
                </span>
                {company.totalSales > 0 && (
                  <span className="flex items-center gap-0.5 text-blue-600">
                    <TrendingUp className="h-3 w-3" />
                    {formatAmount(company.totalSales)}
                  </span>
                )}
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}
