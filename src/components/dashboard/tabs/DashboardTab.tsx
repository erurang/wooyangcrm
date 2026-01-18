"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  CheckCircle,
  ListTodo,
  MessageSquare,
  BarChart3,
} from "lucide-react";
import DateFilterCard from "../DateFilterCard";
import KPISummaryCards from "../KPISummaryCards";
import SalesComparisonChart from "../SalesComparisonChart";
import TopCompaniesCard from "../TopCompaniesCard";
import ExpiringDocumentsCard from "../ExpiringDocumentsCard";
import ExpiringDocumentsModal from "../ExpiringDocumentsModal";
import QuickMemoCard from "../QuickMemoCard";
import TodoModal from "../TodoModal";
import { useKPISummary } from "@/hooks/dashboard/useKPISummary";
import { useYearlyComparison } from "@/hooks/dashboard/useYearlyComparison";
import { useExpiringDocuments } from "@/hooks/dashboard/useExpiringDocuments";
import { useQuickMemo } from "@/hooks/dashboard/useQuickMemo";
import { useLoginUser } from "@/context/login";
import { useDashboard } from "@/context/dashboard";
import { useTodos } from "@/hooks/dashboard/useTodos";
import { HomeTodoCard } from "../HomeTodoCard";
import { ConsultationCard } from "../ConsultationCard";
import type {
  DashboardUserData,
  DashboardConsultation,
} from "@/types/dashboard";

interface Todo {
  id: string;
  user_id: string;
  content: string;
  is_completed: boolean;
  due_date: string | null;
  start_date: string | null;
  sort_order: number;
}

interface DashboardTabProps {
  documentsDetails: DashboardUserData[] | null;
}

export default function DashboardTab({ documentsDetails }: DashboardTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightDocId = searchParams.get("highlight");
  const loginUser = useLoginUser();
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isExpiringModalOpen, setIsExpiringModalOpen] = useState(false);
  const { kpiData, isLoading: kpiLoading } = useKPISummary(loginUser?.id);
  const {
    todos,
    isLoading: todosLoading,
    isAdding: todosAdding,
    deletingTodoId,
    addTodo,
    updateTodo,
    toggleComplete,
    deleteTodo,
    updateTodoOrder,
  } = useTodos(loginUser?.id || "");
  const { data: yearlyData, isLoading: yearlyLoading } = useYearlyComparison(
    loginUser?.id
  );
  const { estimates: expiringEstimates, orders: expiringOrders, isLoading: expiringLoading } =
    useExpiringDocuments(loginUser?.id);
  const {
    memo,
    saveMemo,
    isLoading: memoLoading,
    isSaving: memoSaving,
  } = useQuickMemo(loginUser?.id);
  const {
    dateFilter,
    selectedYear,
    selectedQuarter,
    selectedMonth,
    setDateFilter,
    setSelectedYear,
    setSelectedQuarter,
    setSelectedMonth,
    clientAnalysisData,
  } = useDashboard();

  // 미완료 할 일 (최대 4개)
  const incompleteTodos =
    (todos as Todo[] | undefined)
      ?.filter((todo: Todo) => !todo.is_completed)
      .slice(0, 4) || [];
  const totalIncompleteTodos =
    (todos as Todo[] | undefined)?.filter((todo: Todo) => !todo.is_completed)
      .length || 0;

  return (
    <div className="space-y-4">
      {/* 첫 번째 줄: 기간 선택 + KPI 카드 */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <DateFilterCard
            dateFilter={dateFilter}
            selectedYear={selectedYear}
            selectedQuarter={selectedQuarter}
            selectedMonth={selectedMonth}
            onDateFilterChange={setDateFilter}
            onYearChange={setSelectedYear}
            onQuarterChange={setSelectedQuarter}
            onMonthChange={setSelectedMonth}
          />
          {/* 나의 성과지표 버튼 */}
          <button
            onClick={() => router.push(`/reports/performance/${loginUser?.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <BarChart3 className="h-4 w-4" />
            나의 성과지표
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <div className="hidden md:block w-px h-8 bg-slate-200" />
          <KPISummaryCards
            todayConsultations={kpiData.todayConsultations}
            pendingDocuments={kpiData.pendingDocuments}
            monthSales={kpiData.monthSales}
            previousMonthSales={kpiData.previousMonthSales}
            monthPurchases={kpiData.monthPurchases}
            previousMonthPurchases={kpiData.previousMonthPurchases}
            followUpNeeded={kpiData.followUpNeeded}
            expiringDocuments={kpiData.expiringDocuments}
            isLoading={kpiLoading}
            compact
          />
        </div>
      </div>

      {/* 두 번째 줄: 매출 차트 + 주요 거래처 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {yearlyData ? (
            <SalesComparisonChart
              months={yearlyData.months}
              currentYear={yearlyData.currentYear}
              previousYear={yearlyData.previousYear}
              isLoading={yearlyLoading}
            />
          ) : (
            <SalesComparisonChart
              months={[]}
              currentYear={{
                year: new Date().getFullYear(),
                sales: [],
                purchases: [],
              }}
              previousYear={{
                year: new Date().getFullYear() - 1,
                sales: [],
                purchases: [],
              }}
              isLoading={yearlyLoading}
            />
          )}
        </div>
        <div>
          <TopCompaniesCard
            clientAnalysisData={clientAnalysisData || []}
            isLoading={!clientAnalysisData}
          />
        </div>
      </div>

      {/* 세 번째 줄: 상담 현황 + 최근 문서 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <MessageSquare className="h-4 w-4 text-indigo-600 mr-2" />
                <h2 className="text-sm font-semibold text-slate-800">
                  상담 현황
                </h2>
              </div>
              <button
                onClick={() => router.push("/dashboard/consultation")}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
              >
                전체보기
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </button>
            </div>

            {documentsDetails && documentsDetails.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
                {documentsDetails.flatMap((userObj: DashboardUserData) =>
                  userObj.consultations
                    .slice(0, 4)
                    .map((consultation: DashboardConsultation) => (
                      <ConsultationCard
                        key={consultation.consultation_id}
                        consultation={consultation}
                        highlightDocId={highlightDocId}
                      />
                    ))
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-slate-500">
                <MessageSquare className="h-5 w-5 text-indigo-300 mb-1" />
                <p className="text-sm">상담 내역이 없습니다</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <ExpiringDocumentsCard
            estimates={expiringEstimates}
            orders={expiringOrders}
            isLoading={expiringLoading}
            onViewAll={() => setIsExpiringModalOpen(true)}
          />
        </div>
      </div>

      {/* 네 번째 줄: 할 일 + 빠른 메모 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <ListTodo className="h-4 w-4 text-violet-600 mr-2" />
                <h2 className="text-sm font-semibold text-slate-800">할 일</h2>
                {totalIncompleteTodos > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 rounded-full">
                    {totalIncompleteTodos}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsTodoModalOpen(true)}
                className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center"
              >
                전체보기
                <ChevronRight className="h-3 w-3 ml-0.5" />
              </button>
            </div>

            {todosLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-lg p-3 animate-pulse h-20"
                  >
                    <div className="h-3 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : incompleteTodos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {incompleteTodos.map((todo) => (
                  <HomeTodoCard
                    key={todo.id}
                    todo={todo}
                    onToggleComplete={toggleComplete}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-slate-500">
                <CheckCircle className="h-4 w-4 text-violet-400 mr-2" />
                <p className="text-sm">모든 할 일을 완료했습니다!</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <QuickMemoCard
            memo={memo}
            onSave={saveMemo}
            isLoading={memoLoading}
            isSaving={memoSaving}
          />
        </div>
      </div>

      {/* Todo 모달 */}
      <TodoModal
        isOpen={isTodoModalOpen}
        onClose={() => setIsTodoModalOpen(false)}
        todos={(todos as Todo[]) || []}
        isLoading={todosLoading}
        isAdding={todosAdding}
        deletingTodoId={deletingTodoId}
        onAddTodo={addTodo}
        onUpdateTodo={updateTodo}
        onToggleComplete={toggleComplete}
        onDeleteTodo={deleteTodo}
        onUpdateOrder={updateTodoOrder}
      />

      {/* 임박 문서 모달 */}
      <ExpiringDocumentsModal
        isOpen={isExpiringModalOpen}
        onClose={() => setIsExpiringModalOpen(false)}
        estimates={expiringEstimates}
        orders={expiringOrders}
        isLoading={expiringLoading}
      />
    </div>
  );
}
