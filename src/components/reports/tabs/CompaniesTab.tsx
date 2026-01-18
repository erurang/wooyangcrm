"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Search,
  Building2,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Medal,
  ArrowUpDown,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { DateFilterType, CompanyPerformance } from "@/types/reports";

interface CompaniesTabProps {
  year: number;
  dateFilter: DateFilterType;
  quarter?: number;
  month?: number;
}

type SortField = "totalSales" | "totalPurchases" | "estimateCount" | "orderCount";
type SortDirection = "asc" | "desc";

export default function CompaniesTab({
  year,
  dateFilter,
  quarter,
  month,
}: CompaniesTabProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("totalSales");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // 데이터 페칭
  const fetchCompanyPerformance = async (): Promise<CompanyPerformance[]> => {
    let startDate: string;
    let endDate: string;

    if (dateFilter === "year") {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    } else if (dateFilter === "quarter" && quarter) {
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = quarter * 3;
      startDate = `${year}-${String(startMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(year, endMonth, 0).getDate();
      endDate = `${year}-${String(endMonth).padStart(2, "0")}-${lastDay}`;
    } else if (dateFilter === "month" && month) {
      const lastDay = new Date(year, month, 0).getDate();
      startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
    } else {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    }

    const { data: documents, error } = await supabase
      .from("documents")
      .select(
        `
        id,
        type,
        total_amount,
        date,
        company_id,
        companies (
          id,
          name
        )
      `
      )
      .eq("status", "completed")
      .gte("date", startDate)
      .lte("date", endDate);

    if (error) {
      console.error("Error fetching company performance:", error);
      throw error;
    }

    // 거래처별 집계
    const companyMap = new Map<
      string,
      {
        name: string;
        totalSales: number;
        totalPurchases: number;
        estimateCount: number;
        orderCount: number;
        lastTransaction: string;
      }
    >();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    documents?.forEach((doc: any) => {
      if (!doc.company_id || !doc.companies) return;

      const company = Array.isArray(doc.companies) ? doc.companies[0] : doc.companies;
      if (!company) return;

      const existing = companyMap.get(doc.company_id) || {
        name: company.name || "알 수 없음",
        totalSales: 0,
        totalPurchases: 0,
        estimateCount: 0,
        orderCount: 0,
        lastTransaction: doc.date,
      };

      const amount = Number(doc.total_amount) || 0;

      if (doc.type === "estimate") {
        existing.totalSales += amount;
        existing.estimateCount += 1;
      } else if (doc.type === "order") {
        existing.totalPurchases += amount;
        existing.orderCount += 1;
      }

      if (doc.date > existing.lastTransaction) {
        existing.lastTransaction = doc.date;
      }

      companyMap.set(doc.company_id, existing);
    });

    return Array.from(companyMap.entries()).map(([id, data]) => ({
      id,
      ...data,
      assignedUsers: [],
    }));
  };

  const { data: companies, isLoading } = useSWR(
    `company-performance-${year}-${dateFilter}-${quarter}-${month}`,
    fetchCompanyPerformance,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  // 검색 및 정렬
  const filteredAndSortedCompanies = useMemo(() => {
    let result = companies || [];

    // 검색 필터
    if (searchQuery) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 정렬
    result = [...result].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
    });

    // 순위 부여
    return result.map((c, i) => ({ ...c, rank: i + 1 }));
  }, [companies, searchQuery, sortField, sortDirection]);

  // 정렬 토글
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // 합계 계산
  const totals = useMemo(() => {
    const data = filteredAndSortedCompanies;
    return {
      totalSales: data.reduce((sum, c) => sum + c.totalSales, 0),
      totalPurchases: data.reduce((sum, c) => sum + c.totalPurchases, 0),
      estimateCount: data.reduce((sum, c) => sum + c.estimateCount, 0),
      orderCount: data.reduce((sum, c) => sum + c.orderCount, 0),
    };
  }, [filteredAndSortedCompanies]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
          <div className="h-10 bg-slate-200 rounded w-64 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            <Building2 className="h-3.5 w-3.5 mr-1" />
            거래처 수
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {filteredAndSortedCompanies.length}개
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            <TrendingUp className="h-3.5 w-3.5 mr-1 text-blue-500" />
            총 매출
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {totals.totalSales >= 100000000
              ? `${(totals.totalSales / 100000000).toFixed(1)}억`
              : `${(totals.totalSales / 10000).toLocaleString()}만`}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            <TrendingDown className="h-3.5 w-3.5 mr-1 text-emerald-500" />
            총 매입
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {totals.totalPurchases >= 100000000
              ? `${(totals.totalPurchases / 100000000).toFixed(1)}억`
              : `${(totals.totalPurchases / 10000).toLocaleString()}만`}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            총 문서
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {totals.estimateCount + totals.orderCount}건
          </p>
        </div>
      </div>

      {/* 검색 및 테이블 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="거래처 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <span className="text-sm text-slate-500">
              총 {filteredAndSortedCompanies.length}개 거래처
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 w-12">
                  순위
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  거래처명
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort("totalSales")}
                >
                  <div className="flex items-center justify-end gap-1">
                    매출
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort("totalPurchases")}
                >
                  <div className="flex items-center justify-end gap-1">
                    매입
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort("estimateCount")}
                >
                  <div className="flex items-center justify-center gap-1">
                    견적
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort("orderCount")}
                >
                  <div className="flex items-center justify-center gap-1">
                    발주
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">
                  최근 거래
                </th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedCompanies.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    거래 내역이 없습니다
                  </td>
                </tr>
              ) : (
                filteredAndSortedCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(`/reports/customers/${company.id}`)}
                  >
                    <td className="px-4 py-3">
                      {company.rank && company.rank <= 3 ? (
                        <Medal
                          className={`h-5 w-5 ${
                            company.rank === 1
                              ? "text-yellow-500"
                              : company.rank === 2
                              ? "text-slate-400"
                              : "text-amber-600"
                          }`}
                        />
                      ) : (
                        <span className="text-slate-500 font-medium">
                          {company.rank}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {company.name}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600">
                      {company.totalSales.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {company.totalPurchases.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {company.estimateCount}건
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {company.orderCount}건
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 text-xs">
                      {company.lastTransaction}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
