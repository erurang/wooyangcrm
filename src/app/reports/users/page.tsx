"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Calendar,
  FileText,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from "lucide-react";
import { useUsersList } from "@/hooks/useUserList";
import { useUserSalesSummary } from "@/hooks/reports/useUserSalesSummary";
import { useUserDocumentsCount } from "@/hooks/reports/useUserDocumentsCount";
import { useLoginUser } from "@/context/login";

interface User {
  id: string;
  name: string;
  position?: string;
  level?: string;
}

export default function UsersListPage() {
  const router = useRouter();
  const loginUser = useLoginUser();

  // Hooks는 조건문 이전에 호출되어야 함 (React Rules of Hooks)
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"year" | "quarter" | "month">("year");

  // 직원 목록 가져오기
  const { users, isLoading } = useUsersList();
  const userIds = (users as User[])
    .map((user) => user.id)
    .filter((id): id is string => !!id);

  // 날짜 필터링 설정
  const today = new Date();
  let startDate: string;
  let endDate: string;

  if (dateFilter === "year") {
    startDate = `${today.getFullYear()}-01-01`;
    endDate = `${today.getFullYear()}-12-31`;
  } else if (dateFilter === "quarter") {
    const quarter = Math.floor(today.getMonth() / 3) + 1;
    startDate = `${today.getFullYear()}-${String((quarter - 1) * 3 + 1).padStart(2, "0")}-01`;
    endDate = new Date(today.getFullYear(), quarter * 3, 0).toISOString().split("T")[0];
  } else {
    startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
  }

  // 문서 총 견적 & 발주 금액 가져오기
  const { salesSummary, isLoading: isSalesLoading } = useUserSalesSummary(userIds, startDate, endDate);

  // 상담 개수 가져오기
  const { documents, isLoading: isConsultationsLoading } = useUserDocumentsCount(userIds, startDate, endDate);

  // admin이 아니면 리다이렉트
  if (loginUser?.role !== "admin") {
    router.push(`/reports/performance/${loginUser?.id}`);
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
        <div className="flex flex-col items-center justify-center text-slate-400">
          <Users className="w-12 h-12 mb-4" />
          <p>잘못된 접근입니다</p>
        </div>
      </div>
    );
  }

  // 검색 필터 적용 (id가 없는 유저 제외)
  const filteredUsers = (users as User[]).filter((user) =>
    user.id && user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 기간 라벨
  const getPeriodLabel = () => {
    if (dateFilter === "year") return `${today.getFullYear()}년`;
    if (dateFilter === "quarter") {
      const quarter = Math.floor(today.getMonth() / 3) + 1;
      return `${today.getFullYear()}년 ${quarter}분기`;
    }
    return `${today.getFullYear()}년 ${today.getMonth() + 1}월`;
  };

  return (
    <div className="text-sm">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-500" />
              직원별 실적
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              직원별 영업 실적을 확인하고 분석하세요.
            </p>
          </div>
          <div className="text-sm text-slate-600">
            총 <span className="font-bold text-indigo-600">{filteredUsers.length}</span>명
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-slate-100">
          {/* 검색 */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="직원 이름 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* 기간 필터 */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div className="flex gap-1">
              {[
                { value: "year", label: "연도별" },
                { value: "quarter", label: "분기별" },
                { value: "month", label: "월별" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDateFilter(option.value as "year" | "quarter" | "month")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    dateFilter === option.value
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 현재 기간 표시 */}
        <div className="mt-3 text-xs text-slate-500">
          조회 기간: <span className="font-medium text-slate-700">{getPeriodLabel()}</span>
        </div>
      </div>

      {/* 직원 카드 목록 */}
      {isLoading || isSalesLoading || isConsultationsLoading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 mt-3">데이터를 불러오는 중...</p>
          </div>
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const rawUserSales = salesSummary?.[user.id];
            const userSales = {
              estimates: {
                pending: rawUserSales?.estimates?.pending ?? 0,
                completed: rawUserSales?.estimates?.completed ?? 0,
                canceled: rawUserSales?.estimates?.canceled ?? 0,
                total: rawUserSales?.estimates?.total ?? 0,
              },
              orders: {
                pending: rawUserSales?.orders?.pending ?? 0,
                completed: rawUserSales?.orders?.completed ?? 0,
                canceled: rawUserSales?.orders?.canceled ?? 0,
                total: rawUserSales?.orders?.total ?? 0,
              },
            };

            const rawUserConsultations = documents?.[user.id];
            const userConsultations = {
              estimates: {
                pending: rawUserConsultations?.estimates?.pending ?? 0,
                completed: rawUserConsultations?.estimates?.completed ?? 0,
                canceled: rawUserConsultations?.estimates?.canceled ?? 0,
                total: rawUserConsultations?.estimates?.total ?? 0,
              },
              orders: {
                pending: rawUserConsultations?.orders?.pending ?? 0,
                completed: rawUserConsultations?.orders?.completed ?? 0,
                canceled: rawUserConsultations?.orders?.canceled ?? 0,
                total: rawUserConsultations?.orders?.total ?? 0,
              },
            };

            return (
              <div
                key={user.id}
                onClick={() => router.push(`/reports/performance/${user.id}`)}
                className="bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                {/* 유저 정보 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {user.name}
                      </p>
                      {user.position && (
                        <p className="text-xs text-slate-500">{user.position}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>

                {/* 실적 요약 */}
                <div className="grid grid-cols-2 gap-3">
                  {/* 견적 */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-blue-700">견적</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">
                      {userConsultations.estimates.total.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500 ml-1">건</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="flex items-center gap-0.5 text-emerald-600">
                        <TrendingUp className="w-3 h-3" />
                        {userConsultations.estimates.completed}
                      </span>
                      <span className="flex items-center gap-0.5 text-red-500">
                        <TrendingDown className="w-3 h-3" />
                        {userConsultations.estimates.canceled}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 font-medium mt-2">
                      {userSales.estimates.completed.toLocaleString()}원
                    </p>
                  </div>

                  {/* 발주 */}
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ShoppingCart className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-medium text-purple-700">발주</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">
                      {userConsultations.orders.total.toLocaleString()}
                      <span className="text-xs font-normal text-slate-500 ml-1">건</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="flex items-center gap-0.5 text-emerald-600">
                        <TrendingUp className="w-3 h-3" />
                        {userConsultations.orders.completed}
                      </span>
                      <span className="flex items-center gap-0.5 text-red-500">
                        <TrendingDown className="w-3 h-3" />
                        {userConsultations.orders.canceled}
                      </span>
                    </div>
                    <p className="text-xs text-purple-600 font-medium mt-2">
                      {userSales.orders.completed.toLocaleString()}원
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
          <div className="flex flex-col items-center justify-center text-slate-400">
            <Users className="w-12 h-12 mb-4" />
            <p>검색 결과가 없습니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}
