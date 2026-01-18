"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Search,
  Users,
  FileText,
  MessageSquare,
  ChevronRight,
  Medal,
  ArrowUpDown,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { DateFilterType, EmployeePerformance } from "@/types/reports";

interface EmployeesTabProps {
  year: number;
  dateFilter: DateFilterType;
  quarter?: number;
  month?: number;
}

type SortField =
  | "totalSales"
  | "totalPurchases"
  | "consultationCount"
  | "completedCount";
type SortDirection = "asc" | "desc";

export default function EmployeesTab({
  year,
  dateFilter,
  quarter,
  month,
}: EmployeesTabProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("totalSales");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // 기간 계산
  const getDateRange = () => {
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

    return { startDate, endDate };
  };

  const fetchEmployeePerformance = async (): Promise<EmployeePerformance[]> => {
    const { startDate, endDate } = getDateRange();

    // 사용자 목록
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, position")
      .eq("is_locked", false);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    // 문서 데이터
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("user_id, type, total_amount, status")
      .gte("date", startDate)
      .lte("date", endDate);

    if (docsError) {
      console.error("Error fetching documents:", docsError);
      throw docsError;
    }

    // 상담 데이터
    const { data: consultations, error: consultError } = await supabase
      .from("consultations")
      .select("user_id")
      .gte("date", startDate)
      .lte("date", endDate);

    if (consultError) {
      console.error("Error fetching consultations:", consultError);
      throw consultError;
    }

    // 사용자별 집계
    const userMap = new Map<string, EmployeePerformance>();

    users?.forEach((user) => {
      userMap.set(user.id, {
        id: user.id,
        name: user.name || "알 수 없음",
        position: user.position || "",
        totalSales: 0,
        totalPurchases: 0,
        consultationCount: 0,
        completedCount: 0,
        pendingCount: 0,
        canceledCount: 0,
      });
    });

    // 문서 집계
    documents?.forEach((doc) => {
      if (!doc.user_id) return;
      const user = userMap.get(doc.user_id);
      if (!user) return;

      const amount = Number(doc.total_amount) || 0;

      if (doc.type === "estimate") {
        if (doc.status === "completed") {
          user.totalSales += amount;
          user.completedCount += 1;
        } else if (doc.status === "pending") {
          user.pendingCount += 1;
        } else if (doc.status === "canceled") {
          user.canceledCount += 1;
        }
      } else if (doc.type === "order") {
        if (doc.status === "completed") {
          user.totalPurchases += amount;
          user.completedCount += 1;
        } else if (doc.status === "pending") {
          user.pendingCount += 1;
        } else if (doc.status === "canceled") {
          user.canceledCount += 1;
        }
      }
    });

    // 상담 집계
    consultations?.forEach((c) => {
      if (!c.user_id) return;
      const user = userMap.get(c.user_id);
      if (user) {
        user.consultationCount += 1;
      }
    });

    return Array.from(userMap.values()).filter(
      (u) =>
        u.totalSales > 0 ||
        u.totalPurchases > 0 ||
        u.consultationCount > 0 ||
        u.completedCount > 0
    );
  };

  const { data: employees, isLoading } = useSWR(
    `employee-performance-${year}-${dateFilter}-${quarter}-${month}`,
    fetchEmployeePerformance,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  // 검색 및 정렬
  const filteredAndSortedEmployees = useMemo(() => {
    let result = employees || [];

    if (searchQuery) {
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.position.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    result = [...result].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
    });

    return result.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [employees, searchQuery, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // 합계
  const totals = useMemo(() => {
    const data = filteredAndSortedEmployees;
    return {
      totalSales: data.reduce((sum, e) => sum + e.totalSales, 0),
      totalPurchases: data.reduce((sum, e) => sum + e.totalPurchases, 0),
      consultationCount: data.reduce((sum, e) => sum + e.consultationCount, 0),
      completedCount: data.reduce((sum, e) => sum + e.completedCount, 0),
    };
  }, [filteredAndSortedEmployees]);

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
            <Users className="h-3.5 w-3.5 mr-1" />
            활동 직원
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {filteredAndSortedEmployees.length}명
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            <MessageSquare className="h-3.5 w-3.5 mr-1 text-indigo-500" />
            총 상담
          </div>
          <p className="text-2xl font-bold text-indigo-600">
            {totals.consultationCount.toLocaleString()}건
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="flex items-center text-slate-500 text-xs mb-1">
            <FileText className="h-3.5 w-3.5 mr-1 text-blue-500" />
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
            <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-500" />
            완료 문서
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {totals.completedCount.toLocaleString()}건
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
                placeholder="직원 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <span className="text-sm text-slate-500">
              총 {filteredAndSortedEmployees.length}명 직원
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
                  직원명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                  직급
                </th>
                <th
                  className="px-4 py-3 text-center text-xs font-medium text-slate-500 cursor-pointer hover:bg-slate-100"
                  onClick={() => toggleSort("consultationCount")}
                >
                  <div className="flex items-center justify-center gap-1">
                    상담
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
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
                  onClick={() => toggleSort("completedCount")}
                >
                  <div className="flex items-center justify-center gap-1">
                    완료
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">
                  대기
                </th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    활동 내역이 없습니다
                  </td>
                </tr>
              ) : (
                filteredAndSortedEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(`/reports/users/${employee.id}`)}
                  >
                    <td className="px-4 py-3">
                      {employee.rank && employee.rank <= 3 ? (
                        <Medal
                          className={`h-5 w-5 ${
                            employee.rank === 1
                              ? "text-yellow-500"
                              : employee.rank === 2
                              ? "text-slate-400"
                              : "text-amber-600"
                          }`}
                        />
                      ) : (
                        <span className="text-slate-500 font-medium">
                          {employee.rank}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {employee.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {employee.position || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-indigo-600">
                        <MessageSquare className="h-3 w-3" />
                        {employee.consultationCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600">
                      {employee.totalSales.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {employee.totalPurchases.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle className="h-3 w-3" />
                        {employee.completedCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-amber-600">
                        <Clock className="h-3 w-3" />
                        {employee.pendingCount}
                      </span>
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
