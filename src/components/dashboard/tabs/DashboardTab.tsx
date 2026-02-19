"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  CheckCircle,
  ListTodo,
  MessageSquare,
  BarChart3,
  AlertTriangle,
  Clock,
  Package,
  X,
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
  const [dismissedOrderAlert, setDismissedOrderAlert] = useState(false);

  const userId = loginUser?.id;

  const { kpiData, isLoading: kpiLoading } = useKPISummary(userId);
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
  } = useTodos(userId || "");
  const { data: yearlyData, isLoading: yearlyLoading } = useYearlyComparison(
    userId
  );
  const { estimates: expiringEstimates, orders: expiringOrders, isLoading: expiringLoading } =
    useExpiringDocuments(userId);
  const {
    memo,
    saveMemo,
    isLoading: memoLoading,
    isSaving: memoSaving,
  } = useQuickMemo(userId);
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

  if (!loginUser) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4">
          <div className="h-12 bg-slate-50 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 h-72 animate-pulse">
            <div className="h-full bg-slate-50 rounded-lg" />
          </div>
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 h-72 animate-pulse">
            <div className="h-full bg-slate-50 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 h-56 animate-pulse">
            <div className="h-full bg-slate-50 rounded-lg" />
          </div>
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-5 h-56 animate-pulse">
            <div className="h-full bg-slate-50 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  const incompleteTodos =
    (todos as Todo[] | undefined)
      ?.filter((todo: Todo) => !todo.is_completed)
      .slice(0, 4) || [];
  const totalIncompleteTodos =
    (todos as Todo[] | undefined)?.filter((todo: Todo) => !todo.is_completed)
      .length || 0;

  const allUrgentDocs = [
    ...expiringEstimates.filter(doc => doc.days_remaining <= 3),
    ...expiringOrders.filter(doc => doc.days_remaining <= 3),
  ].sort((a, b) => a.days_remaining - b.days_remaining);
  const overdueDocs = allUrgentDocs.filter(doc => doc.days_remaining < 0);
  const upcomingDocs = allUrgentDocs.filter(doc => doc.days_remaining >= 0);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 긴급 문서 알림 배너 */}
      {!dismissedOrderAlert && allUrgentDocs.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 via-orange-50/50 to-amber-50/30 border border-red-200/60 rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-xl flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {overdueDocs.length > 0 && upcomingDocs.length > 0
                    ? `기한 초과 ${overdueDocs.length}건 / 임박 ${upcomingDocs.length}건`
                    : overdueDocs.length > 0
                    ? `기한 초과 문서 ${overdueDocs.length}건`
                    : `기한 임박 문서 ${upcomingDocs.length}건`}
                </h3>
                <p className="text-xs text-red-600/80 mt-0.5">
                  {overdueDocs.length > 0
                    ? "기한이 지났거나 3일 이내인 문서입니다. 확인이 필요합니다."
                    : "아래 문서의 기한이 3일 이내입니다. 확인이 필요합니다."}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {allUrgentDocs.slice(0, 5).map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => router.push(`/documents/review?highlight=${doc.id}`)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        doc.days_remaining < 0
                          ? "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-200"
                          : "bg-white border border-red-200/80 text-red-700 hover:bg-red-50 shadow-sm"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      <span className="font-bold tabular-nums">
                        {doc.days_remaining < 0
                          ? `${Math.abs(doc.days_remaining)}일 초과`
                          : doc.days_remaining === 0
                          ? "오늘"
                          : doc.days_remaining === 1
                          ? "내일"
                          : `${doc.days_remaining}일 후`}
                      </span>
                      <span className={doc.days_remaining < 0 ? "text-red-200" : "text-red-300"}>|</span>
                      <span className={doc.days_remaining < 0 ? "text-red-100" : "text-sky-600"}>
                        {doc.type === "estimate" ? "[견적]" : "[발주]"}
                      </span>
                      <span>{doc.company_name}</span>
                      <span className={doc.days_remaining < 0 ? "text-red-300" : "text-red-400"}>({doc.document_number})</span>
                    </button>
                  ))}
                  {allUrgentDocs.length > 5 && (
                    <button
                      onClick={() => setIsExpiringModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-100 rounded-lg text-xs font-bold text-red-700 hover:bg-red-200 transition-colors"
                    >
                      +{allUrgentDocs.length - 5}건 더보기
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setDismissedOrderAlert(true)}
              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
              title="알림 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 기간 선택 + KPI */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-3.5">
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
          <button
            onClick={() => router.push(`/reports/performance/${userId}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-sm shadow-sky-200 hover:shadow-md hover:shadow-sky-200"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            나의 성과지표
            <ChevronRight className="h-3 w-3" />
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

      {/* 매출 차트 + 주요 거래처 */}
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

      {/* 상담 현황 + 임박 문서 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-1.5 bg-sky-50 rounded-lg mr-2">
                  <MessageSquare className="h-4 w-4 text-sky-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">상담 현황</h2>
              </div>
              <button
                onClick={() => router.push("/dashboard/consultation")}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-0.5 hover:gap-1 transition-all"
              >
                전체보기
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {documentsDetails && documentsDetails.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
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
              <div className="flex flex-col items-center justify-center h-28 text-slate-400">
                <MessageSquare className="h-6 w-6 text-sky-200 mb-2" />
                <p className="text-sm font-medium">상담 내역이 없습니다</p>
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

      {/* 할 일 + 빠른 메모 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-1.5 bg-violet-50 rounded-lg mr-2">
                  <ListTodo className="h-4 w-4 text-violet-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-800">할 일</h2>
                {totalIncompleteTodos > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-violet-100 text-violet-700 rounded-full tabular-nums">
                    {totalIncompleteTodos}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsTodoModalOpen(true)}
                className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-0.5 hover:gap-1 transition-all"
              >
                전체보기
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {todosLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-slate-50 rounded-xl p-3 animate-pulse h-20"
                  >
                    <div className="h-3 bg-slate-100 rounded w-3/4 mb-2" />
                    <div className="h-2 bg-slate-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : incompleteTodos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {incompleteTodos.map((todo) => (
                  <HomeTodoCard
                    key={todo.id}
                    todo={todo}
                    onToggleComplete={toggleComplete}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-28 text-slate-400">
                <CheckCircle className="h-5 w-5 text-violet-300 mr-2" />
                <p className="text-sm font-medium">모든 할 일을 완료했습니다!</p>
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
